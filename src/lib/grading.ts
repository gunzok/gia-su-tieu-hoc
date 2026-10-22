import { type GradingResult, type Subject, type TeacherVoice } from '../../supabase/functions/_shared/cham-bai';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { ensureSession, supabase } from '@/lib/supabase';

export {
  SubjectNames,
  type GradedItem,
  type GradingResult,
  type Subject,
} from '../../supabase/functions/_shared/cham-bai';

// Chấm qua hàm "cham-bai" trên Supabase: máy chủ gọi Gemini (miễn phí, để thử) hoặc Claude.
// Khoá AI nằm trên máy chủ, không nằm trong app.
const serverTimeoutMs = 150_000;

type GradeParams = {
  /** Các trang bài làm (JPEG base64), theo thứ tự. */
  images: string[];
  subject: Subject;
  grade: number;
  /** Xưng "cô" hay "thầy" trong lời nhận xét. */
  teacher: TeacherVoice;
};

/**
 * AI đã chấm bài: "gemini" hoặc "claude" (qua máy chủ Supabase). "local" là AI trên máy tính ở nhà
 * (LM Studio), đã bỏ từ GSTH-039 nhưng còn trong các bài chấm cũ.
 */
export type GradingEngine = 'claude' | 'gemini' | 'local';

/** Lỗi chấm bài có lời nhắn thân thiện cho bé; code "het-luot" khi đã chấm đủ số bài hôm nay. */
export class GradingError extends Error {
  constructor(
    message: string,
    readonly code?: 'het-luot',
    /** Lúc hết lượt: tài khoản có gói Plus không (theo máy chủ). */
    readonly plus?: boolean,
  ) {
    super(message);
    this.name = 'GradingError';
  }
}

/** Chấm bài qua máy chủ. Hết lượt hôm nay thì báo lỗi het-luot. */
export async function gradeHomework(
  params: GradeParams,
): Promise<{ result: GradingResult; engine: GradingEngine }> {
  const { engine, ...result } = await gradeOnServer(params);
  return { result: normalizeResult(result), engine: engine === 'gemini' ? 'gemini' : 'claude' };
}

// Ký hiệu phép tính đổi sang chữ để giọng đọc tiếng Việt đọc đúng.
const spokenSymbols: [RegExp, string][] = [
  [/(\d)\s*[×x]\s*(?=\d)/g, '$1 nhân '],
  [/(\d)\s*÷\s*(?=\d)/g, '$1 chia '],
  [/(\d)\s+:\s+(?=\d)/g, '$1 chia '],
  [/(\d)\s*\+\s*(?=\d)/g, '$1 cộng '],
  [/(\d)\s*−\s*(?=\d)/g, '$1 trừ '],
  [/(\d)\s+-\s+(?=\d)/g, '$1 trừ '],
  [/\s*=\s*/g, ' bằng '],
];

export function speakable(text: string) {
  return spokenSymbols.reduce((out, [pattern, word]) => out.replace(pattern, word), text);
}

// Điểm tính từ số câu đúng (làm tròn 0.5) để luôn khớp với phần chấm từng câu;
// model nhỏ chạy trên máy hay cộng điểm sai.
export function normalizeResult(result: GradingResult): GradingResult {
  const spokenFeedback = speakable(result.spokenFeedback);
  if (result.items.length === 0) return { ...result, spokenFeedback };
  const correct = result.items.filter((item) => item.correct).length;
  return { ...result, spokenFeedback, score: Math.round((correct / result.items.length) * 20) / 2 };
}

async function gradeOnServer(params: GradeParams): Promise<GradingResult & { engine?: string }> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase trong .env.local.');
  if (!(await ensureSession())) throw new GradingError(offlineMessage);

  const { data, error } = await supabase.functions.invoke<GradingResult & { engine?: string }>('cham-bai', {
    body: params,
    timeout: serverTimeoutMs,
  });
  if (error) throw await friendlyError(error);
  if (!data) throw new GradingError('Máy chủ không trả về kết quả chấm. Con thử lại nhé.');
  return data;
}

const offlineMessage = 'Hình như mất mạng rồi. Ba mẹ kiểm tra Wi-Fi hoặc 4G rồi con thử lại nhé.';

// Máy chủ trả lời lỗi kèm lời nhắn tiếng Việt ({ error, code }); lấy ra để báo cho bé.
async function friendlyError(error: unknown): Promise<GradingError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await (error.context as Response).json();
      if (typeof body?.error === 'string') {
        return new GradingError(body.error, body.code === 'het-luot' ? 'het-luot' : undefined, body.plus === true);
      }
    } catch {
      // Không đọc được lời nhắn thì dùng câu chung bên dưới.
    }
    return new GradingError('Máy chủ chưa chấm được bài. Con đợi một chút rồi thử lại nhé.');
  }
  if (error instanceof FunctionsFetchError) return new GradingError(offlineMessage);
  return new GradingError('Chưa chấm được bài. Con thử lại sau một chút nhé.');
}
