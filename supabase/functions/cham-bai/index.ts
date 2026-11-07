// Supabase Edge Function "cham-bai": nhận ảnh bài làm từ app, gọi AI để chấm.
// Thứ tự AI: Gemini (gói miễn phí, để thử) rồi Claude; đổi bằng secret AI_THU_TU (vd "claude,gemini").
// Bài nhiều trang: mỗi trang một lần gọi AI song song, gộp lại rồi nhờ AI viết lời nhận xét chung.
// Khoá AI chỉ nằm ở đây (Supabase secret GEMINI_API_KEY, ANTHROPIC_API_KEY), không nằm trong app.
//
// Triển khai:  npx supabase functions deploy cham-bai
// Đặt key:     npx supabase secrets set ANTHROPIC_API_KEY=...
//              npx supabase secrets set GEMINI_API_KEY=...
//              npx supabase secrets set REVENUECAT_SECRET_KEY=...  (để biết ai có gói Plus)

import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { allowedOrigins, corsHeaders, originAllowed } from '../_shared/cors.ts';
import { inviteProblem } from '../_shared/moi.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  duplicatePages,
  labelPageItems,
  mergePages,
  needsRegrade,
  pageAsk,
  resultSchema,
  summaryAsk,
  summarySchema,
  systemPrompt,
  type GradingResult,
  type GradingSummary,
  type Subject,
  type TeacherVoice,
} from '../_shared/cham-bai.ts';
import { aiOrder, askGeminiModels, GEMINI_GRADING_MODELS, geminiImages } from '../_shared/gemini.ts';
import { engineOrderFor, GLOBAL_GRADING_DAILY_DEFAULT, isBrowserRequest, limitFrom } from '../_shared/gioi-han.ts';
import { answerKeyNote, checkPage, safeLines } from '../_shared/kiem-tinh.ts';
import { startOfTodayInVietnam } from '../_shared/luot-ngay.ts';
import { hasPlus } from '../_shared/plus.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const subjects: Subject[] = ['toan', 'tieng-viet'];
// Ảnh đã được app thu nhỏ còn khoảng vài trăm KB; chặn ảnh quá lớn để tránh lạm dụng.
const maxImageBase64Length = 6_000_000;
// Số trang tối đa mỗi lần chấm (khớp MAX_PAGES trong app).
const maxPages = 6;

// Số lần chấm bằng Claude mỗi ngày (tính theo giờ Việt Nam), đếm trong bảng grading_usage.
const freeDailyLimit = 3;
const plusDailyLimit = 50;


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

  // Chỉ người dùng đã đăng nhập (kể cả đăng nhập ẩn danh) mới được gọi Claude.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);
  // Bản web dùng thử: chỉ người trong danh sách mời (GIA-69).
  const notInvited = await inviteProblem(
    createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
    userData.user,
    isBrowserRequest(req.headers.get('Origin')),
  );
  if (notInvited) return json(notInvited, 403);

  let body: {
    images?: unknown;
    imageBase64?: unknown;
    pageLines?: unknown;
    subject?: unknown;
    grade?: unknown;
    teacher?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không đúng' }, 400);
  }
  const { subject, grade } = body;
  // Nhiều trang: images[]; app bản cũ gửi một ảnh imageBase64.
  const images = Array.isArray(body.images) ? body.images : [body.imageBase64];
  // Gói Plus mới chọn được Thầy; máy chủ chưa kiểm tra gói nên chỉ nhận đúng 2 giá trị.
  const teacher: TeacherVoice = body.teacher === 'thay' ? 'thay' : 'co';
  if (
    images.length === 0 ||
    images.length > maxPages ||
    !images.every((image) => typeof image === 'string' && image.length > 0 && image.length <= maxImageBase64Length) ||
    !subjects.includes(subject as Subject) ||
    typeof grade !== 'number' ||
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 5
  ) {
    return json({ error: 'Thiếu ảnh, môn hoặc lớp' }, 400);
  }

  // Ghi lượt trước rồi mới đếm, để hai lần gửi cùng lúc không lọt quá giới hạn.
  const userId = userData.user.id;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Bản web (trình duyệt gửi header Origin): người chưa Plus chỉ dùng AI miễn phí (GIA-68).
  const browser = isBrowserRequest(req.headers.get('Origin'));

  // Cầu dao chung: tổng lượt chấm trong ngày đã vượt mức thì bản web tạm nghỉ, tránh chi phí vượt tầm.
  if (browser) {
    const globalLimit = limitFrom(Deno.env.get('GIOI_HAN_CHUNG_NGAY'), GLOBAL_GRADING_DAILY_DEFAULT);
    const { count: total, error: totalError } = await admin
      .from('grading_usage')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfTodayInVietnam().toISOString());
    if (totalError) console.error('Lỗi đếm tổng lượt chấm:', totalError);
    if ((total ?? 0) >= globalLimit) {
      return json(
        { error: 'Hôm nay cô đang rất đông bạn nhỏ, con quay lại chấm vào ngày mai nhé!', code: 'qua-tai' },
        503,
      );
    }
  }
  const { data: usage, error: usageError } = await admin
    .from('grading_usage')
    .insert({ owner_id: userId, pages: images.length })
    .select('id')
    .single();
  if (usageError || !usage) {
    console.error('Lỗi ghi lượt chấm:', usageError);
    return json({ error: 'Máy chủ chưa chấm được bài' }, 500);
  }
  const refundUsage = () => admin.from('grading_usage').delete().eq('id', usage.id);

  const { count, error: countError } = await admin
    .from('grading_usage')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .gte('created_at', startOfTodayInVietnam().toISOString());
  if (countError || count === null) {
    console.error('Lỗi đếm lượt chấm:', countError);
    await refundUsage();
    return json({ error: 'Máy chủ chưa chấm được bài' }, 500);
  }
  // Điện thoại: chỉ hỏi RevenueCat khi đã dùng hết lượt miễn phí. Web: luôn hỏi để chọn AI đúng gói.
  let plus = false;
  if (browser || count > freeDailyLimit) plus = await hasPlus(userId);
  if (count > freeDailyLimit) {
    const limit = plus ? plusDailyLimit : freeDailyLimit;
    if (count > limit) {
      await refundUsage();
      return json(
        {
          error: plus
            ? `Hôm nay con đã chấm ${limit} bài rồi, giỏi quá! Con nghỉ ngơi, mai mình chấm tiếp nhé.`
            : `Hôm nay con đã chấm đủ ${limit} bài rồi. Mai con chấm tiếp nhé! Ba mẹ có thể mở gói Plus để chấm nhiều bài hơn.`,
          code: 'het-luot',
          limit,
          plus,
        },
        429,
      );
    }
  }

  const system = systemPrompt(subject as Subject, grade, teacher);
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const order = engineOrderFor(
    aiOrder(Deno.env.get('AI_THU_TU'), {
      gemini: !!geminiKey,
      claude: !!Deno.env.get('ANTHROPIC_API_KEY'),
    }),
    { plus, browser },
  );
  const ask = (engine: Engine, request: AskRequest) =>
    engine === 'gemini' ? askWithGemini(geminiKey!, system, request) : askWithClaude(system, request);

  // Mỗi trang một lần gọi AI, chạy song song (GIA-49). Trang nào lỗi ở mọi AI thì cả bài lỗi,
  // để không trả về kết quả thiếu trang.
  const pages = images as string[];
  // Môn Toán: code tự tính đáp án từ chữ app đọc được trên từng trang (GIA-53).
  const answerKeys = pages.map((_, index) =>
    subject === 'toan' ? answerKeyNote(checkPage(safeLines(body.pageLines, index))) : '',
  );
  const graded = await Promise.all(
    pages.map((image, index) =>
      gradePage(
        order,
        ask,
        image,
        [pageAsk(teacher, index + 1, pages.length), answerKeys[index]].filter(Boolean).join('\n\n'),
        index + 1,
        pages.length,
      ),
    ),
  );
  const failure = graded.find((page): page is Failure => !('result' in page));
  if (failure) {
    // Chưa chấm được thì trả lại lượt cho bé.
    await refundUsage();
    // Web chưa Plus chỉ có AI miễn phí: lỗi hay quá tải thì hẹn thử lại, không đẩy sang AI trả phí.
    if (browser && !plus) {
      return json({ error: 'Cô đang hơi bận, con thử lại sau ít phút nhé!', code: 'ban' }, 503);
    }
    return json({ error: failure.message }, failure.status);
  }
  const done = graded as Graded<GradingResult>[];
  if (pages.length === 1) return json({ ...done[0].result, engine: done[0].engine });

  // Trang bé chụp trùng (cùng đề, cùng bài làm) chỉ chấm một lần (GIA-50).
  const results = done.map((page) => page.result);
  const duplicates = duplicatePages(results);
  const merged = mergePages(results.filter((_, index) => !duplicates.includes(index + 1)));
  if (duplicates.length > 0) merged.duplicatePages = duplicates;
  if (merged.isHomework && merged.items.length > 0) {
    // Nhờ AI viết lời nhận xét chung cho cả bài; lỗi thì giữ bản ghép tạm từ các trang.
    const summary = await withFallback(order, (engine) =>
      ask(engine, {
        text: summaryAsk(merged, teacher),
        images: [],
        schema: summarySchema,
        maxTokens: 4000,
        level: 'low',
        quick: true,
      }) as Promise<Outcome<GradingSummary>>,
    );
    if ('result' in summary) Object.assign(merged, summary.result);
  }
  return json({ ...merged, engine: done[0].engine });
});

type Engine = 'gemini' | 'claude';
type Failure = { message: string; status: number };
type Outcome<T> = { result: T } | Failure;
type Graded<T> = { result: T; engine: Engine };
type AskRequest = {
  text: string;
  images: string[];
  schema: object;
  maxTokens: number;
  level: 'low' | 'medium';
  /** Việc phụ, có phương án dự phòng: chỉ thử một model, chờ ngắn. */
  quick?: boolean;
};

const summaryTimeoutMs = 30_000;
type Ask = (engine: Engine, request: AskRequest) => Promise<Outcome<unknown>>;

// Thử lần lượt từng AI; AI nào lỗi (hết tiền, hết lượt miễn phí, quá tải…) thì thử AI tiếp theo.
async function withFallback<T>(order: Engine[], attempt: (engine: Engine) => Promise<Outcome<T>>) {
  let lastFailure: Failure = { message: 'Máy chủ chưa chấm được bài', status: 502 };
  for (const engine of order) {
    try {
      const outcome = await attempt(engine);
      if ('result' in outcome) return { result: outcome.result, engine } as Graded<T>;
      lastFailure = outcome;
    } catch (error) {
      console.error(`Lỗi gọi ${engine}:`, error);
    }
  }
  return lastFailure;
}

/** Chấm một trang; trang không có bài nào thì chấm lại một lần (thường là AI bỏ sót). */
async function gradePage(
  order: Engine[],
  ask: Ask,
  image: string,
  text: string,
  page: number,
  total: number,
): Promise<Graded<GradingResult> | Failure> {
  const request: AskRequest = { text, images: [image], schema: resultSchema, maxTokens: 16000, level: 'medium' };
  const gradeOnce = () => withFallback(order, (engine) => ask(engine, request) as Promise<Outcome<GradingResult>>);
  let graded = await gradeOnce();
  if ('result' in graded && needsRegrade(graded.result)) {
    const again = await gradeOnce();
    if ('result' in again && !needsRegrade(again.result)) graded = again;
  }
  if (!('result' in graded) || total === 1) return graded;
  return { ...graded, result: labelPageItems(graded.result, page) };
}

async function askWithGemini(apiKey: string, system: string, request: AskRequest): Promise<Outcome<unknown>> {
  // Luôn suy luận mức thấp: mức trung bình làm Gemini quá giờ ngay cả với bài 1 trang.
  const body = {
    system,
    input: [{ type: 'text' as const, text: request.text }, ...geminiImages(request.images)],
    schema: request.schema,
    maxTokens: request.maxTokens,
    thinking: 'low' as const,
  };
  // Lời nhận xét chung có bản ghép dự phòng, nên không để nó ăn hết giờ chờ của app.
  const text = request.quick
    ? await askGeminiModels(apiKey, body, GEMINI_GRADING_MODELS.slice(0, 1), summaryTimeoutMs, [])
    : await askGeminiModels(apiKey, body);
  return { result: JSON.parse(text) };
}

async function askWithClaude(system: string, request: AskRequest): Promise<Outcome<unknown>> {
  const response = await anthropic.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: request.maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: request.level,
      format: { type: 'json_schema', schema: request.schema },
    },
    system,
    messages: [
      {
        role: 'user',
        content: [
          ...request.images.map((data) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
          })),
          { type: 'text', text: request.text },
        ],
      },
    ],
  });
  if (response.stop_reason === 'refusal') {
    return { message: 'AI không chấm được bài này. Con thử chụp lại bài khác nhé.', status: 422 };
  }
  if (response.stop_reason === 'max_tokens') {
    return { message: 'Bài làm quá dài, AI chưa chấm xong. Con thử chụp ít câu hơn nhé.', status: 422 };
  }
  const text = response.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') return { message: 'AI không trả về kết quả chấm.', status: 502 };
  return { result: JSON.parse(text.text) };
}
