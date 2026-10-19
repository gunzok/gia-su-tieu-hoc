import { router } from 'expo-router';

import { askSystemPrompt, cleanAnswer, type AskItem, type AskRequest } from '../../supabase/functions/_shared/hoi-co';
import { speakable, type Subject } from '@/lib/grading';
import { ensureSession, supabase } from '@/lib/supabase';

export {
  ASK_LIMITS,
  suggestedQuestions,
  type AskItem,
  type AskTurn,
} from '../../supabase/functions/_shared/hoi-co';

// Bé hỏi thêm cô về một câu: gọi hàm "hoi-co" trên Supabase (Claude).
// Claude lỗi (hết tiền, mất mạng…) thì hỏi LM Studio ở nhà, giống như khi chấm bài.
const askTimeoutMs = 45_000;
const lmStudioUrl = process.env.EXPO_PUBLIC_LMSTUDIO_URL?.replace(/\/+$/, '');
const lmStudioModel = process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;

/** Lời cô trả lời, đã đổi ký hiệu phép tính sang chữ để đọc thành tiếng. */
export async function askTeacher(request: AskRequest): Promise<string> {
  try {
    return speakable(cleanAnswer(await askClaude(request)));
  } catch (claudeError) {
    if (!lmStudioUrl) throw claudeError;
    console.warn('Không hỏi được Claude, thử LM Studio:', claudeError);
    return speakable(cleanAnswer(await askLmStudio(request)));
  }
}

async function askClaude(request: AskRequest) {
  if (!supabase) throw new Error('Chưa cấu hình Supabase trong .env.local.');
  if (!(await ensureSession())) throw new Error('Chưa đăng nhập được Supabase.');
  const { data, error } = await supabase.functions.invoke<{ answer?: string }>('hoi-co', {
    body: request,
    timeout: askTimeoutMs,
  });
  if (error) throw error;
  if (!data?.answer) throw new Error('Máy chủ không trả lời.');
  return data.answer;
}

async function askLmStudio(request: AskRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), askTimeoutMs * 2);
  try {
    const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        ...(lmStudioModel ? { model: lmStudioModel } : {}),
        temperature: 0.4,
        max_tokens: 600,
        messages: [{ role: 'system', content: askSystemPrompt(request) }, ...request.turns],
      }),
    });
    if (!response.ok) throw new Error(`LM Studio trả lỗi ${response.status}`);
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    const answer = content && cleanAnswer(content);
    if (!answer) throw new Error('LM Studio không trả lời.');
    return answer;
  } finally {
    clearTimeout(timer);
  }
}

/** Mở màn Hỏi cô (route "hoi-co") cho một câu trong bài chấm. */
export function openAskTeacher(params: { item: AskItem; number: number; subject: Subject; grade: number }) {
  const { question, childAnswer, correctAnswer, correct, explanation } = params.item;
  router.push({
    pathname: '/hoi-co',
    params: {
      item: JSON.stringify({ question, childAnswer, correctAnswer, correct, explanation }),
      number: String(params.number),
      subject: params.subject,
      grade: String(params.grade),
    },
  });
}
