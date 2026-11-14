// Gọi Gemini (Google) qua Interactions API, dùng chung cho cham-bai và hoi-co.
// Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
// Tài liệu: https://ai.google.dev/gemini-api/docs/text-generation và .../structured-output
//
// Gói miễn phí: Google có thể dùng nội dung gửi lên để cải thiện sản phẩm, nên chỉ dùng khi thử
// nội bộ (GSTH-039). Gói Plus dùng khoá trả phí (GIA-77), chọn khoá ở gemini-key.ts.

export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const GEMINI_MODEL = 'gemini-3.8-flash';

export type GeminiInput = { type: 'text'; text: string } | { type: 'image'; data: string; mime_type: string };

export type GeminiRequest = {
  system: string;
  input: GeminiInput[];
  /** Có schema thì Gemini trả JSON đúng mẫu. */
  schema?: object;
  maxTokens: number;
  thinking?: 'minimal' | 'low' | 'medium' | 'high';
  model?: string;
  /**
   * Khoá trả phí (gói Plus, GIA-77): không có hạn mức theo ngày như gói miễn phí, nên không nhớ
   * "hết lượt ngày" và không né model. Cờ này không gửi lên Google.
   */
  paid?: boolean;
};

/** Thân yêu cầu gửi Gemini. store: false để Google không lưu cuộc trò chuyện trên máy chủ. */
export function geminiBody(request: GeminiRequest) {
  return {
    model: request.model ?? GEMINI_MODEL,
    system_instruction: request.system,
    input: request.input,
    store: false,
    generation_config: { max_output_tokens: request.maxTokens, thinking_level: request.thinking ?? 'low' },
    ...(request.schema
      ? { response_format: { type: 'text', mime_type: 'application/json', schema: request.schema } }
      : {}),
  };
}

/** Lấy phần chữ Gemini trả lời: các khối text trong bước model_output. Không có thì trả "". */
export function geminiText(response: unknown): string {
  const steps = (response as { steps?: { type?: string; content?: { type?: string; text?: string }[] }[] })?.steps;
  if (!Array.isArray(steps)) return '';
  return steps
    .filter((step) => step?.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
}

/** Ảnh bài làm (JPEG base64) thành phần input của Gemini. */
export function geminiImages(images: string[]): GeminiInput[] {
  return images.map((data) => ({ type: 'image', data, mime_type: 'image/jpeg' }));
}

/** Lỗi Gemini trả về, kèm mã HTTP để biết có nên thử lại không. */
export class GeminiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Gemini trả lỗi ${status}: ${body.slice(0, 500)}`);
  }
}

/** Đọc "retry in 2h37m19s" / "53s" / "1.5s" trong lời báo lỗi của Google, ra mili giây. */
export function geminiRetryMs(body: string): number | null {
  const match = /retry in ((?:\d+(?:\.\d+)?[hms])+)/i.exec(body);
  if (!match) return null;
  const units = { h: 3_600_000, m: 60_000, s: 1_000 } as const;
  let total = 0;
  for (const [, amount, unit] of match[1].matchAll(/(\d+(?:\.\d+)?)([hms])/gi)) {
    total += Number(amount) * units[unit.toLowerCase() as keyof typeof units];
  }
  return Math.round(total);
}

/** 429 vì hết lượt cả ngày (không phải giới hạn mỗi phút): đợi cũng vô ích. */
export function isDailyQuota(body: string) {
  return /per day/i.test(body);
}

// Model đã hết lượt trong ngày: bỏ qua tới lúc Google hẹn, khỏi tốn thời gian gọi lại.
// Chỉ nhớ trong một lần chạy của hàm (máy chủ tắt thì quên), đủ để các trang sau và lời nhận xét chung né.
const skipUntil = new Map<string, number>();

/** Các model còn dùng được lúc này, giữ thứ tự. */
export function usableModels(models: string[], now = Date.now()) {
  return models.filter((model) => (skipUntil.get(model) ?? 0) <= now);
}

/** Chỉ dùng trong test. */
export function resetGeminiState() {
  skipUntil.clear();
}

/** Đợi giới hạn mỗi phút chỉ khi sau đó còn ít nhất chừng này để chấm. */
const minCallMs = 40_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gọi Gemini, trả về phần chữ. Quá tải tạm thời (503) thì đợi rồi thử lại. Bị giới hạn lượt mỗi phút (429)
 * mà đợi đúng hẹn của Google xong vẫn còn ít nhất minCallMs trước deadline thì đợi rồi thử lại một lần.
 * Hết lượt cả ngày thì ghi nhớ để lần sau bỏ qua model này. Lỗi khác, bị chặn… đều ném lỗi để thử AI khác.
 */
export async function askGemini(
  apiKey: string,
  request: GeminiRequest,
  timeoutMs = 120_000,
  retryDelaysMs = [2_000, 5_000],
  deadline?: number,
): Promise<string> {
  const model = request.model ?? GEMINI_MODEL;
  const send = (ms = timeoutMs) =>
    fetch(GEMINI_URL, {
      method: 'POST',
      // Gửi khoá qua header, không để trong đường link (tránh lộ trong nhật ký).
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(geminiBody(request)),
      signal: AbortSignal.timeout(ms),
    });
  let response = await send();
  for (const delay of retryDelaysMs) {
    if (response.status !== 503) break;
    await sleep(delay);
    response = await send();
  }
  if (response.status === 429) {
    const body = await response.text();
    const wait = geminiRetryMs(body);
    if (isDailyQuota(body)) {
      // Chỉ khoá miễn phí mới bị né cả ngày; khoá trả phí có bảng nhớ riêng (không nhớ gì).
      if (!request.paid) skipUntil.set(model, Date.now() + (wait ?? 3_600_000));
      throw new GeminiError(429, body);
    }
    if (wait === null || deadline === undefined || Date.now() + wait + minCallMs > deadline) {
      throw new GeminiError(429, body);
    }
    await sleep(wait + 500);
    response = await send(Math.min(timeoutMs, deadline - Date.now()));
  }
  if (!response.ok) throw new GeminiError(response.status, await response.text());
  const data = await response.json();
  if (data?.status && data.status !== 'completed') throw new Error(`Gemini chưa xong: ${data.status}`);
  const text = geminiText(data);
  if (!text) throw new Error('Gemini không trả về nội dung.');
  return text;
}

/**
 * Model thử trước; quá tải hay quá giờ thì sang model kế tiếp. 3.6 đứng trước vì đo 06/11:
 * 3.8 lúc 503, lúc quá giờ cả với bài 1 trang (GIA-19).
 */
export const GEMINI_GRADING_MODELS = ['gemini-3.6-flash', GEMINI_MODEL];

/** Mỗi lần gọi một model chờ tối đa chừng này. */
const gradingModelTimeoutMs = 60_000;

/**
 * Tổng giờ cho cả lượt chấm một trang (mọi model, mọi lần đợi). App chờ 150 giây và còn phải chừa
 * 30 giây cho lời nhận xét chung, nên giữ dưới 110 giây.
 */
const gradingBudgetMs = 110_000;

/**
 * Gọi lần lượt từng model còn lượt; model nào lỗi thì thử model sau, hết model thì ném lỗi cuối cùng.
 * Mọi lần gọi và lần đợi đều phải xong trong budgetMs.
 */
export async function askGeminiModels(
  apiKey: string,
  request: GeminiRequest,
  models = GEMINI_GRADING_MODELS,
  timeoutMs = gradingModelTimeoutMs,
  retryDelaysMs?: number[],
  budgetMs = gradingBudgetMs,
): Promise<string> {
  const deadline = Date.now() + budgetMs;
  // Khoá trả phí dùng mọi model; khoá miễn phí bỏ các model đã hết lượt ngày.
  const usable = request.paid ? models : usableModels(models);
  let lastError: unknown = new Error('Gemini đã hết lượt miễn phí hôm nay.');
  for (const model of usable) {
    const left = deadline - Date.now();
    if (left < 5_000) break;
    try {
      const callMs = Math.min(timeoutMs, left);
      return await askGemini(apiKey, { ...request, model }, callMs, retryDelaysMs, deadline);
    } catch (error) {
      console.error(`Lỗi gọi ${model}:`, error);
      lastError = error;
    }
  }
  throw lastError;
}

/** Thứ tự thử AI, đặt bằng secret AI_THU_TU (ví dụ "gemini,claude"). Mặc định Gemini trước vì miễn phí. */
export function aiOrder(value: string | undefined, available: { gemini: boolean; claude: boolean }) {
  const order = (value || 'gemini,claude')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name): name is 'gemini' | 'claude' => name === 'gemini' || name === 'claude');
  return [...new Set(order)].filter((name) => available[name]);
}
