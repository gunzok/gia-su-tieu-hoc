import { itemSpeech } from '@/lib/item-speech';
import { teachers } from '@/lib/teacher';

import { makeItem } from '@/test-utils/factories';

jest.mock('@/lib/supabase', () => ({ supabase: null, ensureSession: jest.fn() }));

describe('itemSpeech', () => {
  it('câu đúng: khen, đổi câu khen theo số câu', () => {
    const item = makeItem({ explanation: '2 x 7 = 14.' });
    expect(itemSpeech(item, 1, teachers.co)).toBe('Câu 1 nhé. Đúng rồi, con giỏi quá! 2 nhân 7 bằng 14.');
    expect(itemSpeech(item, 2, teachers.co)).toContain('Con làm đúng rồi đấy!');
    expect(itemSpeech(item, 5, teachers.co)).toContain('Đúng rồi, con giỏi quá!');
  });

  it('câu sai: nói bé ghi gì và kết quả đúng', () => {
    const item = makeItem({ correct: false, childAnswer: '12', correctAnswer: '14', explanation: 'Con đếm lại nhé.' });
    expect(itemSpeech(item, 3, teachers.co)).toBe(
      'Câu 3, mình cùng xem lại nhé. Con ghi 12, nhưng kết quả đúng là 14. Con đếm lại nhé.',
    );
  });

  it('câu sai không có lời giảng: gia sư hứa giảng lại', () => {
    const item = makeItem({ correct: false, childAnswer: '12', correctAnswer: undefined, explanation: '' });
    expect(itemSpeech(item, 1, teachers.thay)).toBe('Câu 1, mình cùng xem lại nhé. Thầy giảng lại cho con nghe nhé.');
  });

  it('đáp án quá dài thì không đọc lại', () => {
    const item = makeItem({ correct: false, childAnswer: 'a'.repeat(41), correctAnswer: '14', explanation: 'Xem lại.' });
    expect(itemSpeech(item, 1, teachers.co)).toBe('Câu 1, mình cùng xem lại nhé. Xem lại.');
  });
});
