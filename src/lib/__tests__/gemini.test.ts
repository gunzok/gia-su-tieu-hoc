import {
  aiOrder,
  askGemini,
  askGeminiModels,
  geminiBody,
  geminiImages,
  geminiRetryMs,
  geminiText,
  isDailyQuota,
  resetGeminiState,
  usableModels,
} from '../../../supabase/functions/_shared/gemini';
import { conversationText } from '../../../supabase/functions/_shared/hoi-co';

describe('geminiBody', () => {
  it('gửi lời dặn, ảnh và mẫu JSON; không lưu hội thoại trên máy chủ Google', () => {
    const body = geminiBody({
      system: 'Cô chấm bài',
      input: [{ type: 'text', text: 'Chấm giúp con' }, ...geminiImages(['abc'])],
      schema: { type: 'object' },
      maxTokens: 1000,
    });
    expect(body.model).toBe('gemini-3.8-flash');
    expect(body.system_instruction).toBe('Cô chấm bài');
    expect(body.store).toBe(false);
    expect(body.input[1]).toEqual({ type: 'image', data: 'abc', mime_type: 'image/jpeg' });
    expect(body.response_format).toEqual({ type: 'text', mime_type: 'application/json', schema: { type: 'object' } });
    expect(body.generation_config).toEqual({ max_output_tokens: 1000, thinking_level: 'low' });
  });

  it('không có mẫu JSON thì không gửi response_format', () => {
    expect(geminiBody({ system: 's', input: [], maxTokens: 10 })).not.toHaveProperty('response_format');
  });
});

describe('geminiText', () => {
  it('ghép chữ trong các bước model_output, bỏ phần suy nghĩ', () => {
    const response = {
      status: 'completed',
      steps: [
        { type: 'thought', content: [{ type: 'text', text: 'nghĩ…' }] },
        { type: 'model_output', content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] },
      ],
    };
    expect(geminiText(response)).toBe('{"a":1}');
  });

  it('trả lời lạ thì trả chuỗi rỗng', () => {
    expect(geminiText({})).toBe('');
    expect(geminiText(null)).toBe('');
  });
});

describe('aiOrder', () => {
  it('mặc định Gemini trước, Claude sau; bỏ AI chưa có khoá', () => {
    expect(aiOrder(undefined, { gemini: true, claude: true })).toEqual(['gemini', 'claude']);
    expect(aiOrder(undefined, { gemini: false, claude: true })).toEqual(['claude']);
  });

  it('đổi thứ tự bằng secret, bỏ tên lạ và tên trùng', () => {
    expect(aiOrder('Claude, gemini, lmstudio, claude', { gemini: true, claude: true })).toEqual(['claude', 'gemini']);
  });
});

describe('conversationText', () => {
  it('câu đầu tiên chỉ có câu bé hỏi', () => {
    expect(conversationText([{ role: 'user', content: 'Vì sao con sai?' }])).toContain('Bé hỏi: Vì sao con sai?');
  });

  it('có lịch sử thì ghi lại các lượt trước, câu cuối là câu bé vừa hỏi', () => {
    const text = conversationText([
      { role: 'user', content: 'Vì sao con sai?' },
      { role: 'assistant', content: 'Vì 14 trừ 8 bằng 6.' },
      { role: 'user', content: 'Cô giảng lại được không?' },
    ]);
    expect(text).toContain('Đã trả lời: Vì 14 trừ 8 bằng 6.');
    expect(text.indexOf('Bé hỏi: Cô giảng lại được không?')).toBeGreaterThan(text.indexOf('Đã trả lời'));
  });
});

describe('askGemini thử lại khi quá tải (GIA-55)', () => {
  const ok = { ok: true, status: 200, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'xong' }] }] }) };
  const busy = { ok: false, status: 503, text: async () => 'high demand' };
  const request = { system: 's', input: [], maxTokens: 10 };
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('503 rồi thành công thì trả kết quả', async () => {
    fetchMock.mockResolvedValueOnce(busy).mockResolvedValueOnce(ok);
    await expect(askGemini('k', request, 1000, [0, 0])).resolves.toBe('xong');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('503 mãi thì báo lỗi sau số lần thử', async () => {
    fetchMock.mockResolvedValue(busy);
    await expect(askGemini('k', request, 1000, [0, 0])).rejects.toThrow('503');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('lỗi khác không thử lại', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => 'quota' });
    await expect(askGemini('k', request, 1000, [0, 0])).rejects.toThrow('429');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('askGeminiModels chuyển model (GIA-19)', () => {
  const ok = { ok: true, status: 200, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'xong' }] }] }) };
  const busy = { ok: false, status: 503, text: async () => 'high demand' };
  const request = { system: 's', input: [], maxTokens: 10, thinking: 'low' as const };
  const fetchMock = jest.fn();
  const modelOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body).model;

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('model đầu quá tải thì sang model sau', async () => {
    fetchMock.mockResolvedValueOnce(busy).mockResolvedValueOnce(ok);
    await expect(askGeminiModels('k', request, ['a', 'b'], 1000, [])).resolves.toBe('xong');
    expect([modelOf(0), modelOf(1)]).toEqual(['a', 'b']);
  });

  it('model đầu quá giờ thì sang model sau', async () => {
    fetchMock.mockRejectedValueOnce(new Error('TimeoutError')).mockResolvedValueOnce(ok);
    await expect(askGeminiModels('k', request, ['a', 'b'], 1000, [])).resolves.toBe('xong');
  });

  it('model đầu chạy được thì không gọi model sau', async () => {
    fetchMock.mockResolvedValueOnce(ok);
    await askGeminiModels('k', request, ['a', 'b'], 1000, []);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mọi model đều lỗi thì báo lỗi để thử AI khác', async () => {
    fetchMock.mockResolvedValue(busy);
    await expect(askGeminiModels('k', request, ['a', 'b'], 1000, [])).rejects.toThrow('503');
  });
});

describe('Gemini hết lượt miễn phí (lỗi chấm bài 10/11)', () => {
  const ok = { ok: true, status: 200, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'xong' }] }] }) };
  const perDay = {
    ok: false,
    status: 429,
    text: async () => 'Rate limit exceeded for model a (limit: 20 requests per day on Free Tier). Please retry in 2h37m19s',
  };
  const perMinute = (seconds: number) => ({
    ok: false,
    status: 429,
    text: async () => `Rate limit exceeded (limit: 5 requests per minute on Free Tier). Please retry in ${seconds}s`,
  });
  const request = { system: 's', input: [], maxTokens: 10 };
  const fetchMock = jest.fn();
  const modelOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body).model;

  beforeEach(() => {
    resetGeminiState();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('đọc thời gian Google hẹn thử lại', () => {
    expect(geminiRetryMs('Please retry in 53s')).toBe(53_000);
    expect(geminiRetryMs('Please retry in 2h37m19s')).toBe((2 * 3600 + 37 * 60 + 19) * 1000);
    expect(geminiRetryMs('Please retry in 1.5s')).toBe(1_500);
    expect(geminiRetryMs('quota')).toBeNull();
    expect(isDailyQuota('limit: 20 requests per day')).toBe(true);
    expect(isDailyQuota('limit: 5 requests per minute')).toBe(false);
  });

  it('model hết lượt cả ngày thì lần sau bỏ qua, gọi thẳng model kế', async () => {
    fetchMock.mockResolvedValueOnce(perDay).mockResolvedValue(ok);
    await askGeminiModels('k', request, ['a', 'b'], 1000, []);
    expect(usableModels(['a', 'b'])).toEqual(['b']);
    fetchMock.mockClear();
    await askGeminiModels('k', request, ['a', 'b'], 1000, []);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(modelOf(0)).toBe('b');
  });

  it('hết hẹn của Google thì dùng lại model đó', async () => {
    fetchMock.mockResolvedValueOnce(perDay);
    await expect(askGeminiModels('k', request, ['a'], 1000, [])).rejects.toThrow('429');
    expect(usableModels(['a'])).toEqual([]);
    expect(usableModels(['a'], Date.now() + 3 * 3_600_000)).toEqual(['a']);
  });

  it('mọi model đều hết lượt ngày thì báo lỗi ngay, không gọi Google', async () => {
    fetchMock.mockResolvedValue(perDay);
    await expect(askGeminiModels('k', request, ['a'], 1000, [])).rejects.toThrow('429');
    fetchMock.mockClear();
    await expect(askGeminiModels('k', request, ['a'], 1000, [])).rejects.toThrow('hết lượt');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('giới hạn mỗi phút: đợi đúng hẹn rồi thử lại khi còn đủ giờ', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValueOnce(perMinute(20)).mockResolvedValueOnce(ok);
    const result = askGeminiModels('k', request, ['a'], 60_000, [], 110_000);
    await jest.advanceTimersByTimeAsync(21_000);
    await expect(result).resolves.toBe('xong');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('giới hạn mỗi phút mà không đủ giờ đợi thì sang model kế', async () => {
    fetchMock.mockResolvedValueOnce(perMinute(53)).mockResolvedValueOnce(ok);
    await expect(askGeminiModels('k', request, ['a', 'b'], 1000, [], 30_000)).resolves.toBe('xong');
    expect([modelOf(0), modelOf(1)]).toEqual(['a', 'b']);
  });
});

describe('Khoá Gemini trả phí (GIA-77)', () => {
  const ok = { ok: true, status: 200, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'xong' }] }] }) };
  const busy = { ok: false, status: 503, text: async () => 'high demand' };
  const perDay = {
    ok: false,
    status: 429,
    text: async () => 'Rate limit exceeded for model a (limit: 20 requests per day on Free Tier). Please retry in 2h37m19s',
  };
  const request = { system: 's', input: [], maxTokens: 10 };
  const fetchMock = jest.fn();
  const modelOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body).model;

  beforeEach(() => {
    resetGeminiState();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('không gửi cờ paid lên Google', () => {
    expect(geminiBody({ ...request, paid: true })).not.toHaveProperty('paid');
  });

  it('khoá trả phí không né model mà khoá miễn phí đã hết lượt ngày', async () => {
    fetchMock.mockResolvedValueOnce(perDay).mockResolvedValue(ok);
    await askGeminiModels('mien-phi', request, ['a', 'b'], 1000, []);
    expect(usableModels(['a', 'b'])).toEqual(['b']);
    fetchMock.mockClear();
    await askGeminiModels('tra-phi', { ...request, paid: true }, ['a', 'b'], 1000, []);
    expect(modelOf(0)).toBe('a');
  });

  it('khoá trả phí bị 429 theo ngày cũng không làm khoá miễn phí bỏ qua model', async () => {
    fetchMock.mockResolvedValueOnce(perDay).mockResolvedValue(ok);
    await askGeminiModels('tra-phi', { ...request, paid: true }, ['a', 'b'], 1000, []);
    expect(usableModels(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('khoá trả phí vẫn thử lại khi 503', async () => {
    fetchMock.mockResolvedValueOnce(busy).mockResolvedValueOnce(ok);
    await expect(askGemini('tra-phi', { ...request, paid: true }, 1000, [0])).resolves.toBe('xong');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
