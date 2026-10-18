import Anthropic from '@anthropic-ai/sdk';

export type Subject = 'toan' | 'tieng-viet';

export const SubjectNames: Record<Subject, string> = {
  toan: 'Toán',
  'tieng-viet': 'Tiếng Việt',
};

export type GradedItem = {
  question: string;
  childAnswer: string;
  correct: boolean;
  explanation: string;
};

export type GradingResult = {
  score: number;
  spokenFeedback: string;
  items: GradedItem[];
  parentNote: string;
};

// Giai đoạn thử nghiệm: key nằm trong .env.local và được đóng gói vào app.
// Trước khi phát hành phải chuyển lời gọi này sang server riêng.
const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// Không chờ quá lâu khi mất mạng, để kịp chuyển sang LM Studio.
const client = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true,
  maxRetries: 1,
  timeout: 90_000,
});

// LM Studio chạy trên máy tính ở nhà, dùng khi không chấm được bằng Claude.
// Ví dụ: http://192.168.1.13:1234 (địa chỉ máy tính trong mạng Wi-Fi nhà).
const lmStudioUrl = process.env.EXPO_PUBLIC_LMSTUDIO_URL?.replace(/\/+$/, '');
const lmStudioModel = process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;
const lmStudioTimeoutMs = 240_000;

const resultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'spokenFeedback', 'items', 'parentNote'],
  properties: {
    score: { type: 'number', description: 'Điểm trên thang 10, làm tròn 0.5' },
    spokenFeedback: {
      type: 'string',
      description: 'Lời nhận xét nói trực tiếp với bé, sẽ được đọc thành tiếng',
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'childAnswer', 'correct', 'explanation'],
        properties: {
          question: { type: 'string' },
          childAnswer: { type: 'string' },
          correct: { type: 'boolean' },
          explanation: { type: 'string' },
        },
      },
    },
    parentNote: {
      type: 'string',
      description: 'Ghi chú ngắn cho phụ huynh: lỗi bé hay mắc và gợi ý luyện thêm',
    },
  },
};

function systemPrompt(subject: Subject, grade: number) {
  return `Bạn là cô giáo tiểu học người Việt, hiền và kiên nhẫn, đang chấm bài tập về nhà môn ${SubjectNames[subject]} lớp ${grade} theo chương trình giáo dục phổ thông Việt Nam.

Ảnh là bài làm của bé (có thể viết tay, chụp nghiêng hoặc mờ). Hãy:
1. Đọc từng câu hỏi và câu trả lời của bé. Chỗ nào không đọc rõ thì ghi "không đọc rõ" thay vì đoán.
2. Chấm đúng/sai từng câu và giải thích ngắn gọn, dễ hiểu với trẻ lớp ${grade}.
3. Cho điểm trên thang 10.
4. Viết spokenFeedback để đọc thành tiếng cho bé nghe: xưng "cô", gọi bé là "con", 3–5 câu ngắn, khen điều bé làm tốt trước, chỉ ra tối đa 2 lỗi quan trọng nhất và cách sửa, kết thúc bằng một câu động viên. Không dùng ký hiệu, emoji hay định dạng vì câu này sẽ được đọc lên.
5. Viết parentNote cho phụ huynh: lỗi bé hay mắc và gợi ý cách luyện thêm ở nhà.

Nếu ảnh không phải bài tập, trả về score 0, items rỗng và nhẹ nhàng nhờ bé chụp lại bài làm.`;
}

type GradeParams = {
  imageBase64: string;
  subject: Subject;
  grade: number;
};

/** Chấm bằng Claude; nếu không được thì tự chuyển sang LM Studio ở nhà, không báo cho bé. */
export async function gradeHomework(params: GradeParams): Promise<GradingResult> {
  try {
    return await gradeWithClaude(params);
  } catch (claudeError) {
    if (!lmStudioUrl) throw claudeError;
    try {
      return await gradeWithLmStudio(params);
    } catch (lmStudioError) {
      console.warn('Claude lỗi:', claudeError, '— LM Studio lỗi:', lmStudioError);
      throw new Error(
        'Cô chưa chấm được bài. Bố mẹ kiểm tra mạng Internet, hoặc bật LM Studio trên máy tính ở nhà nhé.',
      );
    }
  }
}

async function gradeWithClaude(params: GradeParams): Promise<GradingResult> {
  if (!apiKey) {
    throw new Error('Chưa có API key. Hãy thêm EXPO_PUBLIC_ANTHROPIC_API_KEY vào file .env.local.');
  }

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: resultSchema },
    },
    system: systemPrompt(params.subject, params.grade),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: params.imageBase64 },
          },
          { type: 'text', text: 'Cô chấm bài này giúp con nhé.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('AI không chấm được bài này. Con thử chụp lại bài khác nhé.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Bài làm quá dài, AI chưa chấm xong. Con thử chụp ít câu hơn nhé.');
  }

  const text = response.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') {
    throw new Error('AI không trả về kết quả chấm.');
  }
  return JSON.parse(text.text) as GradingResult;
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
          { role: 'system', content: systemPrompt(params.subject, params.grade) },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${params.imageBase64}` },
              },
              { type: 'text', text: 'Cô chấm bài này giúp con nhé.' },
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

async function firstLoadedModel(signal: AbortSignal): Promise<string> {
  const response = await fetch(`${lmStudioUrl}/v1/models`, { signal });
  if (!response.ok) throw new Error(`LM Studio trả lỗi ${response.status}`);
  const data = await response.json();
  const id: string | undefined = data?.data?.[0]?.id;
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
