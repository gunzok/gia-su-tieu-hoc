// Gọi Gemini (Google) qua Interactions API, dùng chung cho cham-bai và hoi-co.
// Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
// Tài liệu: https://ai.google.dev/gemini-api/docs/text-generation và .../structured-output
//
// Gói miễn phí: Google có thể dùng nội dung gửi lên để cải thiện sản phẩm, nên chỉ dùng khi thử
// nội bộ (GSTH-039). Khi có người dùng thật thì dùng gói trả phí hoặc Claude.

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

/**
 * Gọi Gemini, trả về phần chữ. Quá tải tạm thời (503) thì đợi rồi thử lại; lỗi khác, hết lượt miễn phí,
 * bị chặn… đều ném lỗi để thử AI khác.
 */
export async function askGemini(
  apiKey: string,
  request: GeminiRequest,
  timeoutMs = 120_000,
  retryDelaysMs = [2_000, 5_000],
): Promise<string> {
  const send = () =>
    fetch(GEMINI_URL, {
      method: 'POST',
      // Gửi khoá qua header, không để trong đường link (tránh lộ trong nhật ký).
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(geminiBody(request)),
      signal: AbortSignal.timeout(timeoutMs),
    });
  let response = await send();
  for (const delay of retryDelaysMs) {
    if (response.status !== 503) break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    response = await send();
  }
  if (!response.ok) throw new Error(`Gemini trả lỗi ${response.status}: ${(await response.text()).slice(0, 500)}`);
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

/** Hai model phải xong trong giờ chờ của app (150 giây), kể cả các lần đợi khi 503. */
const gradingModelTimeoutMs = 60_000;

/** Gọi lần lượt từng model; model nào lỗi thì thử model sau, hết model thì ném lỗi cuối cùng. */
export async function askGeminiModels(
  apiKey: string,
  request: GeminiRequest,
  models = GEMINI_GRADING_MODELS,
  timeoutMs = gradingModelTimeoutMs,
  retryDelaysMs?: number[],
): Promise<string> {
  let lastError: unknown = new Error('Chưa có model Gemini để gọi.');
  for (const model of models) {
    try {
      return await askGemini(apiKey, { ...request, model }, timeoutMs, retryDelaysMs);
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
