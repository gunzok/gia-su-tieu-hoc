import {
  gradeFromTranscript,
  resultSchema,
  scoreFromItems,
  systemPrompt,
  transcribePrompt,
  transcriptSchema,
  type GradingResult,
  type Transcript,
  type Subject,
  type TeacherVoice,
} from '../../supabase/functions/_shared/cham-bai';
import { Platform } from 'react-native';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { ensureSession, supabase } from '@/lib/supabase';

export {
  SubjectNames,
  type GradedItem,
  type GradingResult,
  type Subject,
} from '../../supabase/functions/_shared/cham-bai';

// Chấm qua hàm "cham-bai" trên Supabase: máy chủ gọi Gemini (miễn phí, để thử) rồi Claude.
// Khoá AI nằm trên máy chủ, không nằm trong app.
const serverTimeoutMs = 150_000;

// LM Studio chạy trên máy tính ở nhà: dự phòng cuối khi máy chủ không chấm được (GIA-54, như GSTH-003).
// Ví dụ: http://192.168.1.13:1234 (địa chỉ máy tính trong mạng Wi-Fi nhà). Bật cả ở bản phát hành.
// Bản web không dùng LM Studio: địa chỉ mạng nhà không truy cập được từ trình duyệt của người khác (GIA-70).
const lmStudioUrl = Platform.OS === 'web' ? undefined : process.env.EXPO_PUBLIC_LMSTUDIO_URL?.replace(/\/+$/, '');
const lmStudioModel = process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;
// Chấm 2 bước (chép bài rồi chấm) mất khoảng 3 phút trên máy Mac M-series với AI 8B.
// Mỗi bước LM Studio có giới hạn riêng: bài 2 trang đo được 3 phút 40 giây chỉ riêng bước chép.
const lmStudioStepTimeoutMs = 360_000;
const lmStudioModelsTimeoutMs = 15_000;

type GradeParams = {
  /** Các trang bài làm (JPEG base64), theo thứ tự. */
  images: string[];
  /** Các dòng chữ đọc được trên từng trang (môn Toán, GIA-53). */
  pageLines?: string[][];
  subject: Subject;
  grade: number;
  /** Xưng "cô" hay "thầy" trong lời nhận xét. */
  teacher: TeacherVoice;
};

/**
 * AI đã chấm bài: "gemini" hoặc "claude" (qua máy chủ Supabase); "local" là AI trên máy tính ở nhà
 * (LM Studio), dùng khi máy chủ không chấm được.
 */
export type GradingEngine = 'claude' | 'gemini' | 'local';

/** Lỗi chấm bài có lời nhắn thân thiện cho bé; code "het-luot" khi đã chấm đủ số bài hôm nay, "mat-mang" khi mất mạng. */
export class GradingError extends Error {
  constructor(
    message: string,
    readonly code?: 'het-luot' | 'mat-mang',
    /** Lúc hết lượt: tài khoản có gói Plus không (theo máy chủ). */
    readonly plus?: boolean,
  ) {
    super(message);
    this.name = 'GradingError';
  }
}

/**
 * Chấm qua máy chủ (Gemini rồi Claude); nếu không được (mất mạng, máy chủ lỗi, AI hết tiền…) thì
 * chuyển sang LM Studio ở nhà. Hết lượt hôm nay thì báo ngay, không chuyển.
 */
export async function gradeHomework(
  params: GradeParams,
): Promise<{ result: GradingResult; engine: GradingEngine }> {
  try {
    const { engine, ...result } = await gradeOnServer(params);
    return { result: normalizeResult(result), engine: engine === 'gemini' ? 'gemini' : 'claude' };
  } catch (serverError) {
    if (!lmStudioUrl || (serverError instanceof GradingError && serverError.code === 'het-luot')) {
      throw serverError;
    }
    console.warn('Máy chủ không chấm được, chuyển sang LM Studio:', serverError);
    try {
      return { result: normalizeResult(await gradeWithLmStudio(params)), engine: 'local' };
    } catch (lmStudioError) {
      console.warn('Máy chủ lỗi:', serverError, '— LM Studio lỗi:', lmStudioError);
      if (serverError instanceof GradingError && serverError.code === 'mat-mang') throw serverError;
      throw new GradingError(
        'Cô trên máy chủ đang bận và chưa nối được LM Studio ở nhà. Bố mẹ thử lại sau ít phút nhé, lượt chấm vẫn còn nguyên.',
      );
    }
  }
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

// Điểm tính từ số phần đúng (làm tròn 0.5) để luôn khớp với phần chấm từng câu;
// model nhỏ chạy trên máy hay cộng điểm sai.
export function normalizeResult(result: GradingResult): GradingResult {
  const spokenFeedback = speakable(result.spokenFeedback);
  if (result.items.length === 0) return { ...result, spokenFeedback };
  return { ...result, spokenFeedback, score: scoreFromItems(result.items) };
}

async function gradeOnServer(params: GradeParams): Promise<GradingResult & { engine?: string }> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase trong .env.local.');
  if (!(await ensureSession())) throw new GradingError(offlineMessage, 'mat-mang');

  const startedAt = Date.now();
  const { data, error } = await supabase.functions.invoke<GradingResult & { engine?: string }>('cham-bai', {
    body: params,
    timeout: serverTimeoutMs,
  });
  if (error) throw await friendlyError(error, Date.now() - startedAt);
  if (!data) throw new GradingError('Máy chủ không trả về kết quả chấm. Con thử lại nhé.');
  return data;
}

const offlineMessage = 'Hình như mất mạng rồi. Ba mẹ kiểm tra Wi-Fi hoặc 4G rồi con thử lại nhé.';
const busyMessage = 'Cô đang bận một chút, chưa chấm được bài. Con đợi một lát rồi thử lại nhé, lượt chấm vẫn còn nguyên.';

/** Tiêu đề và lời nhắn khi chấm lỗi: chỉ bảo kiểm tra mạng khi đúng là mất mạng. */
export function gradingFailureMessage(error: unknown) {
  if (error instanceof GradingError && error.code === 'mat-mang') {
    return { title: 'Kết nối đang có vấn đề', message: error.message };
  }
  return { title: 'Chưa chấm được bài', message: error instanceof GradingError ? error.message : busyMessage };
}

// Máy chủ trả lời lỗi kèm lời nhắn tiếng Việt ({ error, code }); lấy ra để báo cho bé.
async function friendlyError(error: unknown, elapsedMs: number): Promise<GradingError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    // Máy chủ hoặc AI lỗi (hết tiền, quá tải): lời nhắn của máy chủ không giúp gì cho bé.
    if (response.status >= 500) return new GradingError(busyMessage);
    try {
      const body = await response.json();
      if (typeof body?.error === 'string') {
        return new GradingError(body.error, body.code === 'het-luot' ? 'het-luot' : undefined, body.plus === true);
      }
    } catch {
      // Không đọc được lời nhắn thì dùng câu chung bên dưới.
    }
    return new GradingError(busyMessage);
  }
  if (error instanceof FunctionsFetchError) {
    // Hết giờ chờ nghĩa là AI chậm, mạng vẫn tốt. Tên lỗi khi huỷ khác nhau tuỳ máy, nên xem cả thời gian đã chờ.
    const timedOut =
      elapsedMs >= serverTimeoutMs - 1000 ||
      ['AbortError', 'TimeoutError'].includes((error.context as Error | undefined)?.name ?? '');
    return timedOut ? new GradingError(busyMessage) : new GradingError(offlineMessage, 'mat-mang');
  }
  return new GradingError(busyMessage);
}

// LM Studio có API giống OpenAI: /v1/chat/completions, ảnh gửi dạng data URL.
// AI nhỏ trên máy vừa đọc ảnh vừa giải toán thì hay bỏ sót bài (tô màu, nối, bảng) và chấm nhầm,
// nên chấm 2 bước: (1) nhìn ảnh, chỉ chép lại đề và bài bé làm; (2) chấm từ bản chép, không gửi ảnh.
// Đo trên bài thật lớp 2 (GSTH-038): 1 bước tìm được 5/8 bài, 2 bước tìm đủ 8/8, chấm đúng 7/8.
async function gradeWithLmStudio(params: GradeParams): Promise<GradingResult> {
  const model = lmStudioModel ?? (await firstLoadedModel());
  const images = params.images.map((image) => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${image}` },
  }));
  const grading = systemPrompt(params.subject, params.grade, params.teacher);

  const transcript = await askLmStudio<Transcript>(model, 'ban_chep', transcriptSchema, [
    { role: 'system', content: transcribePrompt(params.subject) },
    { role: 'user', content: [...images, { type: 'text', text: 'Chép lại đầy đủ các bài trong ảnh.' }] },
  ]);
  // Không chép được bài nào (ảnh không phải bài tập, hoặc AI trả lời lạ): chấm 1 bước như cũ, để AI
  // nhìn ảnh và tự báo "không phải bài tập".
  if (!transcript.exercises?.length) {
    return await askLmStudio<GradingResult>(model, 'ket_qua_cham_bai', resultSchema, [
      { role: 'system', content: grading },
      { role: 'user', content: [...images, { type: 'text', text: teacherAsk(params.teacher) }] },
    ]);
  }
  const graded = await askLmStudio<GradingResult>(model, 'ket_qua_cham_bai', resultSchema, [
    { role: 'system', content: grading },
    { role: 'user', content: gradeFromTranscript(transcript) },
  ]);
  // Bản chép nhận biết lớp khi chưa biết lớp đã khai báo, nên tin hơn bước chấm.
  return {
    ...graded,
    isHomework: transcript.isHomework ?? graded.isHomework,
    detectedGrade: transcript.detectedGrade ?? graded.detectedGrade,
  };
}

function teacherAsk(teacher: TeacherVoice) {
  return `${teacher === 'thay' ? 'Thầy' : 'Cô'} chấm bài này giúp con nhé.`;
}

async function askLmStudio<T>(
  model: string,
  name: string,
  schema: object,
  messages: { role: 'system' | 'user'; content: unknown }[],
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), lmStudioStepTimeoutMs);
  let response: Response;
  try {
    response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 6000,
        response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
        messages,
      }),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`LM Studio trả lỗi ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  // Model có suy luận (vd qwen3.8) khi bị ép mẫu JSON có lúc để kết quả trong reasoning_content, content rỗng.
  const content: string | undefined = message?.content || message?.reasoning_content;
  if (!content) throw new Error('LM Studio không trả về kết quả chấm.');
  return parseJsonObject(content) as T;
}

// /api/v0/models của LM Studio cho biết model nào đang được nạp; ưu tiên model biết nhìn ảnh.
async function firstLoadedModel(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), lmStudioModelsTimeoutMs);
  const response = await fetch(`${lmStudioUrl}/api/v0/models`, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
  if (!response.ok) throw new Error(`LM Studio trả lỗi ${response.status}`);
  const data = await response.json();
  const models: { id: string; type?: string; state?: string }[] = data?.data ?? [];
  const loaded = models.filter((m) => m.state === 'loaded');
  const id = (loaded.find((m) => m.type === 'vlm') ?? loaded[0])?.id;
  if (!id) throw new Error('LM Studio chưa nạp model nào.');
  return id;
}

// Model chạy trên máy đôi khi viết thêm chữ quanh JSON, nên chỉ lấy phần {...}.
function parseJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('LM Studio trả về kết quả không đúng dạng.');
  return JSON.parse(text.slice(start, end + 1));
}
