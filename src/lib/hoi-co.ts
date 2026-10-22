import { router } from 'expo-router';

import { cleanAnswer, type AskItem, type AskRequest } from '../../supabase/functions/_shared/hoi-co';
import { speakable, type Subject } from '@/lib/grading';
import { ensureSession, supabase } from '@/lib/supabase';

export {
  ASK_LIMITS,
  suggestedQuestions,
  type AskItem,
  type AskTurn,
} from '../../supabase/functions/_shared/hoi-co';

// Bé hỏi thêm cô về một câu: gọi hàm "hoi-co" trên Supabase (máy chủ hỏi Gemini hoặc Claude).
const askTimeoutMs = 45_000;

/** Lời cô trả lời, đã đổi ký hiệu phép tính sang chữ để đọc thành tiếng. */
export async function askTeacher(request: AskRequest): Promise<string> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase trong .env.local.');
  if (!(await ensureSession())) throw new Error('Chưa đăng nhập được Supabase.');
  const { data, error } = await supabase.functions.invoke<{ answer?: string }>('hoi-co', {
    body: request,
    timeout: askTimeoutMs,
  });
  if (error) throw error;
  if (!data?.answer) throw new Error('Máy chủ không trả lời.');
  return speakable(cleanAnswer(data.answer));
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
