const mockInvoke = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
  ensureSession: jest.fn(async () => true),
}));

const params = { images: ['abc'], subject: 'toan' as const, grade: 2, teacher: 'co' as const };

function loadGrading(lmStudioUrl?: string) {
  if (lmStudioUrl) process.env.EXPO_PUBLIC_LMSTUDIO_URL = lmStudioUrl;
  else delete process.env.EXPO_PUBLIC_LMSTUDIO_URL;
  // Nạp lại cả supabase-js để lỗi tạo trong test cùng lớp với lỗi grading.ts kiểm tra.
  let grading!: typeof import('@/lib/grading');
  let errors!: typeof import('@supabase/supabase-js');
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports -- cần nạp lại module sau khi đổi biến môi trường */
    grading = require('@/lib/grading');
    errors = require('@supabase/supabase-js');
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
  return {
    ...grading,
    // Máy chủ trả lỗi kèm nội dung JSON, giống supabase.functions.invoke khi hàm trả 4xx/5xx.
    httpError: (body: unknown) => new errors.FunctionsHttpError({ json: async () => body }),
    fetchError: () => new errors.FunctionsFetchError('offline'),
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_LMSTUDIO_URL;
  jest.restoreAllMocks();
});

describe('gradeHomework khi hết lượt', () => {
  it('báo lỗi het-luot kèm lời nhắn của máy chủ, gói Miễn phí', async () => {
    const { gradeHomework, GradingError, httpError } = loadGrading();
    mockInvoke.mockResolvedValue({
      data: null,
      error: httpError({ error: 'Hôm nay con đã chấm đủ 3 bài rồi.', code: 'het-luot', plus: false }),
    });

    const error = await gradeHomework(params).catch((e) => e);
    expect(error).toBeInstanceOf(GradingError);
    expect(error.code).toBe('het-luot');
    expect(error.plus).toBe(false);
    expect(error.message).toBe('Hôm nay con đã chấm đủ 3 bài rồi.');
  });

  it('hết lượt thì báo ngay, không chuyển sang LM Studio dù đã cấu hình', async () => {
    const { gradeHomework, httpError } = loadGrading('http://192.168.1.13:1234');
    mockInvoke.mockResolvedValue({
      data: null,
      error: httpError({ error: 'Hết lượt', code: 'het-luot', plus: true }),
    });

    await expect(gradeHomework(params)).rejects.toMatchObject({ code: 'het-luot', plus: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('gradeHomework khi lỗi khác', () => {
  it('mất mạng thì báo lời nhắn thân thiện, không có code', async () => {
    const { gradeHomework, GradingError, fetchError } = loadGrading();
    mockInvoke.mockResolvedValue({ data: null, error: fetchError() });

    const error = await gradeHomework(params).catch((e) => e);
    expect(error).toBeInstanceOf(GradingError);
    expect(error.code).toBeUndefined();
    expect(error.message).toMatch(/mất mạng/);
  });

  it('máy chủ lỗi và chưa cấu hình LM Studio thì báo lời nhắn của máy chủ', async () => {
    const { gradeHomework, GradingError, httpError } = loadGrading();
    mockInvoke.mockResolvedValue({ data: null, error: httpError({ error: 'Máy chủ chưa chấm được bài' }) });

    const error = await gradeHomework(params).catch((e) => e);
    expect(error).toBeInstanceOf(GradingError);
    expect(error.message).toBe('Máy chủ chưa chấm được bài');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('máy chủ lỗi thì thử LM Studio ở nhà (dự phòng ở cả bản phát hành, GIA-54)', async () => {
    const { gradeHomework, httpError } = loadGrading('http://192.168.1.13:1234');
    mockInvoke.mockResolvedValue({ data: null, error: httpError({ error: 'Máy chủ chưa chấm được bài' }) });
    fetchMock.mockRejectedValue(new Error('LM Studio tắt'));

    await expect(gradeHomework(params)).rejects.toThrow(/LM Studio/);
    expect(fetchMock).toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[0][0])).toContain('http://192.168.1.13:1234');
  });

  it('máy chủ lỗi, LM Studio chấm được thì ghi engine local', async () => {
    const { gradeHomework, httpError } = loadGrading('http://192.168.1.13:1234');
    mockInvoke.mockResolvedValue({ data: null, error: httpError({ error: 'Máy chủ chưa chấm được bài' }) });
    const graded = {
      isHomework: true,
      detectedGrade: 2,
      fitsGrade: true,
      items: [{ kind: 'tinh', question: '2 + 2', childAnswer: '4', correctAnswer: '4', correct: true, explanation: '' }],
      score: 10,
      spokenFeedback: 'Giỏi lắm',
      parentNote: '',
    };
    const reply = (content: unknown) => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
    });
    fetchMock
      // Model đang nạp, bản chép (bước 1), kết quả chấm (bước 2).
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'qwen-vl', type: 'vlm', state: 'loaded' }] }) })
      .mockResolvedValueOnce(reply({ exercises: [] }))
      .mockResolvedValueOnce(reply(graded));

    const { result, engine } = await gradeHomework(params);
    expect(engine).toBe('local');
    expect(result.items).toHaveLength(1);
  });
});

describe('gradeHomework khi chấm được', () => {
  const graded = {
    isHomework: true,
    detectedGrade: 2,
    fitsGrade: true,
    items: [
      { question: 'a', childAnswer: '3', correctAnswer: '6', correct: false, explanation: '' },
      { question: 'b', childAnswer: '4', correctAnswer: '4', correct: true, explanation: '' },
    ],
    score: 9,
    spokenFeedback: '2 + 2 = 4',
    parentNote: '',
  };

  it('ghi đúng AI máy chủ đã dùng (gemini) và tính lại điểm theo số câu đúng', async () => {
    const { gradeHomework } = loadGrading();
    mockInvoke.mockResolvedValue({ data: { ...graded, engine: 'gemini' }, error: null });

    const { result, engine } = await gradeHomework(params);
    expect(engine).toBe('gemini');
    expect(result.score).toBe(5);
    expect(result).not.toHaveProperty('engine');
    expect(result.spokenFeedback).toBe('2 cộng 2 bằng 4');
  });

  it('máy chủ cũ không trả engine thì coi là claude', async () => {
    const { gradeHomework } = loadGrading();
    mockInvoke.mockResolvedValue({ data: graded, error: null });

    expect((await gradeHomework(params)).engine).toBe('claude');
  });
});
