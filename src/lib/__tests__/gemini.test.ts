import { aiOrder, geminiBody, geminiImages, geminiText } from '../../../supabase/functions/_shared/gemini';
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
