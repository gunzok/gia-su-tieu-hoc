import { cleanAnswer } from '../../../supabase/functions/_shared/hoi-co';

describe('cleanAnswer', () => {
  it('bỏ dấu sao, gạch dưới, dấu thăng', () => {
    expect(cleanAnswer('**Đúng rồi** con, _giỏi_ lắm!')).toBe('Đúng rồi con, giỏi lắm!');
    expect(cleanAnswer('## Lời giảng\nCon làm thế này nhé.')).toBe('Lời giảng\nCon làm thế này nhé.');
  });

  it('bỏ emoji', () => {
    expect(cleanAnswer('Giỏi quá 🎉👍 con ơi!')).toBe('Giỏi quá  con ơi!');
    expect(cleanAnswer('Đúng rồi ❤️')).toBe('Đúng rồi');
  });

  it('bỏ "Dạ", "Vâng" đầu câu và viết hoa lại chữ đầu', () => {
    expect(cleanAnswer('Dạ, con làm đúng rồi.')).toBe('Con làm đúng rồi.');
    expect(cleanAnswer('Vâng ạ! mình cùng xem nhé.')).toBe('Mình cùng xem nhé.');
    expect(cleanAnswer('dạ con xem lại nhé')).toBe('Con xem lại nhé');
  });

  it('không bỏ chữ "dạ" khi không đứng đầu câu', () => {
    expect(cleanAnswer('Con dạy em nhé.')).toBe('Con dạy em nhé.');
    expect(cleanAnswer('Dạy con cách làm.')).toBe('Dạy con cách làm.');
  });

  it('bỏ dòng kẻ ngang và dòng ghi chú trong ngoặc', () => {
    expect(cleanAnswer('Câu một.\n---\nCâu hai.\n(Trả lời ngắn gọn)')).toBe('Câu một.\nCâu hai.');
    expect(cleanAnswer('A\n===\nB')).toBe('A\nB');
  });

  it('bỏ gạch đầu dòng, số thứ tự và mũi tên', () => {
    expect(cleanAnswer('- Con đếm que tính.\n1. Rồi cộng lại.')).toBe('Con đếm que tính.\nRồi cộng lại.');
    expect(cleanAnswer('3 + 5 → 8')).toBe('3 + 5, 8');
  });

  it('bỏ phần suy nghĩ <think>', () => {
    expect(cleanAnswer('<think>bé hỏi gì nhỉ</think>Con giỏi lắm!')).toBe('Con giỏi lắm!');
  });

  it('gộp nhiều dòng trống', () => {
    expect(cleanAnswer('Một.\n\n\n\nHai.')).toBe('Một.\n\nHai.');
  });
});
