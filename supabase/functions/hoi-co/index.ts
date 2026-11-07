// Supabase Edge Function "hoi-co": bé hỏi thêm cô về một câu trong bài vừa chấm.
// Thứ tự AI giống cham-bai: Gemini (miễn phí, để thử) rồi Claude; đổi bằng secret AI_THU_TU.
// Khoá AI chỉ nằm ở đây (Supabase secret GEMINI_API_KEY, ANTHROPIC_API_KEY), không nằm trong app.
//
// Triển khai:  npx supabase functions deploy hoi-co

import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { allowedOrigins, corsHeaders, originAllowed } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { aiOrder, askGemini } from '../_shared/gemini.ts';
import { engineOrderFor, isBrowserRequest, WEB_DAILY } from '../_shared/gioi-han.ts';
import { recordUsage } from '../_shared/luot-ngay.ts';
import { hasPlus } from '../_shared/plus.ts';
import {
  ASK_LIMITS,
  askSystemPrompt,
  cleanAnswer,
  conversationText,
  type AskRequest,
  type AskTurn,
} from '../_shared/hoi-co.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });


function isText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function validTurns(value: unknown): value is AskTurn[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > ASK_LIMITS.maxTurns) return false;
  return value.every(
    (turn, index) =>
      turn &&
      // Xen kẽ bé hỏi / cô đáp, bắt đầu và kết thúc bằng câu bé hỏi.
      turn.role === (index % 2 === 0 ? 'user' : 'assistant') &&
      isText(turn.content, turn.role === 'user' ? ASK_LIMITS.maxChars : 2000),
  ) && value.length % 2 === 1;
}

Deno.serve(async (req) => {
  // Chỉ các địa chỉ web trong ALLOWED_ORIGINS mới được gọi từ trình duyệt (GIA-70).
  const origin = req.headers.get('Origin');
  const allowed = allowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const cors = corsHeaders(origin, allowed);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!originAllowed(origin, allowed)) return json({ error: 'Địa chỉ này không được phép' }, 403);
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);

  let body: Partial<AskRequest>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không đúng' }, 400);
  }
  const { subject, grade, item, turns } = body;
  const teacher = body.teacher === 'thay' ? 'thay' : 'co';
  if (
    (subject !== 'toan' && subject !== 'tieng-viet') ||
    typeof grade !== 'number' ||
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 5 ||
    !item ||
    !isText(item.question, 1000) ||
    typeof item.childAnswer !== 'string' ||
    typeof item.explanation !== 'string' ||
    !validTurns(turns)
  ) {
    return json({ error: 'Thiếu câu hỏi hoặc dữ liệu bài' }, 400);
  }

  const system = askSystemPrompt({
    subject,
    grade,
    teacher,
    item: {
      question: item.question,
      childAnswer: item.childAnswer.slice(0, 1000),
      correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer.slice(0, 500) : undefined,
      correct: !!item.correct,
      explanation: item.explanation.slice(0, 2000),
    },
  });
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  // Bản web (trình duyệt gửi header Origin): giới hạn lượt hỏi mỗi ngày; chưa Plus thì chỉ dùng AI miễn phí (GIA-68).
  const browser = isBrowserRequest(req.headers.get('Origin'));
  let plus = false;
  let refund: (() => unknown) | null = null;
  if (browser) {
    plus = await hasPlus(userData.user.id);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const used = await recordUsage(admin, userData.user.id, 'hoi-co');
    if (!used) return json({ error: 'Máy chủ chưa trả lời được' }, 500);
    refund = used.refund;
    const limit = plus ? WEB_DAILY.askPlus : WEB_DAILY.askFree;
    if (used.count > limit) {
      await refund();
      return json(
        {
          error: `Hôm nay con đã hỏi ${teacher === 'thay' ? 'thầy' : 'cô'} nhiều rồi, mai mình hỏi tiếp nhé!`,
          code: 'het-luot',
          limit,
        },
        429,
      );
    }
  }
  const order = engineOrderFor(
    aiOrder(Deno.env.get('AI_THU_TU'), {
      gemini: !!geminiKey,
      claude: !!Deno.env.get('ANTHROPIC_API_KEY'),
    }),
    { plus, browser },
  );

  for (const engine of order) {
    try {
      const answer =
        engine === 'gemini'
          ? await askGemini(geminiKey!, { system, input: [{ type: 'text', text: conversationText(turns) }], maxTokens: 2000, thinking: 'low' }, 45_000)
          : await askClaude(system, turns);
      if (answer === null) {
        return json({ answer: `Câu này ${teacher === 'thay' ? 'thầy' : 'cô'} chưa trả lời được. Con hỏi bố mẹ giúp nhé!` });
      }
      const cleaned = cleanAnswer(answer);
      if (cleaned) return json({ answer: cleaned, engine });
    } catch (error) {
      console.error(`Lỗi hỏi ${engine}:`, error);
    }
  }
  // Chưa trả lời được thì trả lại lượt cho bé.
  await refund?.();
  if (browser && !plus) return json({ error: 'Cô đang hơi bận, con thử lại sau ít phút nhé!', code: 'ban' }, 503);
  return json({ error: 'Máy chủ chưa trả lời được' }, 502);
});

/** Hỏi Claude; null khi Claude từ chối trả lời. */
async function askClaude(system: string, turns: AskTurn[]): Promise<string | null> {
  const response = await anthropic.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // Trò chuyện ngắn: nghĩ ít cho nhanh và rẻ.
    output_config: { effort: 'low' },
    system,
    messages: turns.map((turn) => ({ role: turn.role, content: turn.content })),
  });
  const text = response.content.find((block) => block.type === 'text');
  if (response.stop_reason === 'refusal' || !text || text.type !== 'text') return null;
  return text.text;
}
