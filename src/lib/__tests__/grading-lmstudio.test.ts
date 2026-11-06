import { gradeFromTranscript, type Transcript } from '../../../supabase/functions/_shared/cham-bai';

const mockInvoke = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
  ensureSession: jest.fn(async () => true),
}));

const params = { images: ['anh1', 'anh2'], subject: 'toan' as const, grade: 2, teacher: 'co' as const };

const transcript: Transcript = {
  exercises: [
    { page: 1, number: 'Bài 1', kind: 'tinh', question: 'Tính nhẩm.', given: 'a) 14 - 8 =', childWork: 'a) 3' },
    {
      page: 1,
      number: 'Bài 2',
      kind: 'to-mau',
      question: 'Tô màu ngôi nhà có kết quả lớn nhất.',
      given: 'Ngôi nhà 1: 12 - 9\nNgôi nhà 2: 15 - 6',
      childWork: 'Ngôi nhà 1: không tô\nNgôi nhà 2: màu hồng',
    },
  ],
};

const graded = {
  isHomework: true,
  detectedGrade: 2,
  fitsGrade: true,
  items: [],
  score: 0,
  spokenFeedback: 'Con giỏi lắm.',
  parentNote: '',
};

function lmReply(body: unknown) {
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(body) } }] }) };
}

function loadGrading() {
  process.env.EXPO_PUBLIC_LMSTUDIO_URL = 'http://192.168.1.13:1234';
  process.env.EXPO_PUBLIC_LMSTUDIO_MODEL = 'qwen3-vl-8b';
  let grading!: typeof import('@/lib/grading');
  let errors!: typeof import('@supabase/supabase-js');
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports -- cần nạp lại module sau khi đổi biến môi trường */
    grading = require('@/lib/grading');
    errors = require('@supabase/supabase-js');
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
  // Claude lỗi (chưa nạp tiền) để app chuyển sang LM Studio.
  mockInvoke.mockResolvedValue({
    data: null,
    error: new errors.FunctionsHttpError({ json: async () => ({ error: 'Máy chủ chưa chấm được bài' }) }),
  });
  return grading;
}

const fetchMock = jest.fn();
const body = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);
const hasImage = (call: number) =>
  body(call).messages.some((m: { content: unknown }) => JSON.stringify(m.content).includes('image_url'));

beforeEach(() => {
  mockInvoke.mockReset();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_LMSTUDIO_URL;
  delete process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;
  jest.restoreAllMocks();
});

describe('chấm bằng LM Studio 2 bước (GSTH-038)', () => {
  it('bước 1 gửi ảnh để chép bài, bước 2 chấm từ bản chép mà không gửi lại ảnh', async () => {
    const { gradeHomework } = loadGrading();
    fetchMock.mockResolvedValueOnce(lmReply(transcript)).mockResolvedValueOnce(lmReply(graded));

    const { result, engine } = await gradeHomework(params);

    expect(engine).toBe('local');
    expect(result.spokenFeedback).toBe('Con giỏi lắm.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body(0).response_format.json_schema.name).toBe('ban_chep');
    expect(hasImage(0)).toBe(true);
    expect(body(1).response_format.json_schema.name).toBe('ket_qua_cham_bai');
    expect(hasImage(1)).toBe(false);
    expect(JSON.stringify(body(1).messages)).toContain('Ngôi nhà 2: màu hồng');
  });

  it('không chép được bài nào thì chấm 1 bước, gửi ảnh như cũ', async () => {
    const { gradeHomework } = loadGrading();
    fetchMock.mockResolvedValueOnce(lmReply({ exercises: [] })).mockResolvedValueOnce(lmReply(graded));

    await gradeHomework(params);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body(1).response_format.json_schema.name).toBe('ket_qua_cham_bai');
    expect(hasImage(1)).toBe(true);
  });
});

describe('gradeFromTranscript', () => {
  it('nói rõ số bài phải chấm và ghi đủ đề, phần in sẵn, phần bé làm của từng bài', () => {
    const text = gradeFromTranscript(transcript);
    expect(text).toContain('chấm ĐÚNG 2 bài');
    expect(text).toContain('Bài 2 (trang 1, Bài 2, dạng to-mau)');
    expect(text).toContain('Ngôi nhà 2: 15 - 6');
    expect(text).toContain('Ngôi nhà 1: không tô');
  });
});

describe('nhận biết lớp từ bản chép (GIA-55)', () => {
  it('lấy lớp ở bước chép, không gọi thêm lần nào, và lời dặn chép không nói lớp đã khai báo', async () => {
    const { gradeHomework } = loadGrading();
    fetchMock
      .mockResolvedValueOnce(lmReply({ ...transcript, isHomework: true, detectedGrade: 4 }))
      .mockResolvedValueOnce(lmReply({ ...graded, detectedGrade: 2 }));

    const { result } = await gradeHomework(params);

    expect(result.detectedGrade).toBe(4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body(0).messages[0].content).not.toContain('lớp 2 của');
  });
});

describe('model có suy luận (GIA-54)', () => {
  const inReasoning = (reply: unknown) => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '', reasoning_content: JSON.stringify(reply) } }] }),
  });

  it('content rỗng thì đọc kết quả JSON trong reasoning_content', async () => {
    const { gradeHomework } = loadGrading();
    fetchMock.mockResolvedValueOnce(inReasoning(transcript)).mockResolvedValueOnce(inReasoning(graded));

    const { result, engine } = await gradeHomework(params);

    expect(engine).toBe('local');
    expect(result.spokenFeedback).toBe('Con giỏi lắm.');
  });

  it('cả hai đều rỗng thì báo chưa chấm được', async () => {
    const { gradeHomework } = loadGrading();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '' } }] }) });

    await expect(gradeHomework(params)).rejects.toThrow('Chưa chấm được bài');
  });
});
