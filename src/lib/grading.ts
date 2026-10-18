import {
  resultSchema,
  systemPrompt,
  type GradingResult,
  type Subject,
  type TeacherVoice,
} from '../../supabase/functions/_shared/cham-bai';
import { ensureSession, supabase } from '@/lib/supabase';

export {
  SubjectNames,
  type GradedItem,
  type GradingResult,
  type Subject,
} from '../../supabase/functions/_shared/cham-bai';

// Chấm bằng Claude qua hàm "cham-bai" trên Supabase: API key nằm trên máy chủ, không nằm trong app.
// Không chờ quá lâu khi mất mạng, để kịp chuyển sang LM Studio.
const claudeTimeoutMs = 120_000;

// LM Studio chạy trên máy tính ở nhà, dùng khi không chấm được bằng Claude.
// Ví dụ: http://192.168.1.13:1234 (địa chỉ máy tính trong mạng Wi-Fi nhà).
const lmStudioUrl = process.env.EXPO_PUBLIC_LMSTUDIO_URL?.replace(/\/+$/, '');
const lmStudioModel = process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;
const lmStudioTimeoutMs = 240_000;

type GradeParams = {
  imageBase64: string;
  subject: Subject;
  grade: number;
  /** Xưng "cô" hay "thầy" trong lời nhận xét. */
  teacher: TeacherVoice;
};

/** "claude": chấm qua máy chủ Supabase; "local": chấm bằng AI trên máy tính ở nhà (LM Studio). */
export type GradingEngine = 'claude' | 'local';

/** Chấm bằng Claude; nếu không được (chưa mua gói, hết lượt, mất mạng…) thì chuyển sang LM Studio ở nhà. */
export async function gradeHomework(
  params: GradeParams,
): Promise<{ result: GradingResult; engine: GradingEngine }> {
  try {
    return { result: normalizeResult(await gradeWithClaude(params)), engine: 'claude' };
  } catch (claudeError) {
    console.warn('Không chấm được bằng Claude, chuyển sang LM Studio:', claudeError);
    if (!lmStudioUrl) throw claudeError;
    try {
      return { result: normalizeResult(await gradeWithLmStudio(params)), engine: 'local' };
    } catch (lmStudioError) {
      console.warn('Claude lỗi:', claudeError, '— LM Studio lỗi:', lmStudioError);
      throw new Error(
        'Chưa chấm được bài. Bố mẹ kiểm tra mạng Internet, hoặc bật LM Studio trên máy tính ở nhà nhé.',
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

function speakable(text: string) {
  return spokenSymbols.reduce((out, [pattern, word]) => out.replace(pattern, word), text);
}

// Điểm tính từ số câu đúng (làm tròn 0.5) để luôn khớp với phần chấm từng câu;
// model nhỏ chạy trên máy hay cộng điểm sai.
function normalizeResult(result: GradingResult): GradingResult {
  const spokenFeedback = speakable(result.spokenFeedback);
  if (result.items.length === 0) return { ...result, spokenFeedback };
  const correct = result.items.filter((item) => item.correct).length;
  return { ...result, spokenFeedback, score: Math.round((correct / result.items.length) * 20) / 2 };
}

async function gradeWithClaude(params: GradeParams): Promise<GradingResult> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase trong .env.local.');
  if (!(await ensureSession())) throw new Error('Chưa đăng nhập được Supabase.');

  const { data, error } = await supabase.functions.invoke<GradingResult>('cham-bai', {
    body: params,
    timeout: claudeTimeoutMs,
  });
  if (error) throw error;
  if (!data) throw new Error('Máy chủ không trả về kết quả chấm.');
  return data;
}

// LM Studio có API giống OpenAI: /v1/chat/completions, ảnh gửi dạng data URL.
async function gradeWithLmStudio(params: GradeParams): Promise<GradingResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), lmStudioTimeoutMs);
  try {
    const model = lmStudioModel ?? (await firstLoadedModel(controller.signal));
    const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 4000,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'ket_qua_cham_bai', strict: true, schema: resultSchema },
        },
        messages: [
          { role: 'system', content: systemPrompt(params.subject, params.grade, params.teacher) },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${params.imageBase64}` },
              },
              { type: 'text', text: `${params.teacher === 'thay' ? 'Thầy' : 'Cô'} chấm bài này giúp con nhé.` },
            ],
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`LM Studio trả lỗi ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('LM Studio không trả về kết quả chấm.');
    return parseJsonObject(content);
  } finally {
    clearTimeout(timer);
  }
}

// /api/v0/models của LM Studio cho biết model nào đang được nạp; ưu tiên model biết nhìn ảnh.
async function firstLoadedModel(signal: AbortSignal): Promise<string> {
  const response = await fetch(`${lmStudioUrl}/api/v0/models`, { signal });
  if (!response.ok) throw new Error(`LM Studio trả lỗi ${response.status}`);
  const data = await response.json();
  const models: { id: string; type?: string; state?: string }[] = data?.data ?? [];
  const loaded = models.filter((m) => m.state === 'loaded');
  const id = (loaded.find((m) => m.type === 'vlm') ?? loaded[0])?.id;
  if (!id) throw new Error('LM Studio chưa nạp model nào.');
  return id;
}

// Model chạy trên máy đôi khi viết thêm chữ quanh JSON, nên chỉ lấy phần {...}.
function parseJsonObject(text: string): GradingResult {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('LM Studio trả về kết quả không đúng dạng.');
  return JSON.parse(text.slice(start, end + 1)) as GradingResult;
}
