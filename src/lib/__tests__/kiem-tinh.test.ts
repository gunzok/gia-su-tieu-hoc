import { answerKeyNote, checkLine, checkPage, evaluate } from '../../../supabase/functions/_shared/kiem-tinh';

describe('evaluate', () => {
  it('tính cộng trừ từ trái sang phải', () => {
    expect(evaluate('90 - 45 - 15')).toBe(30);
    expect(evaluate('64 - 28 + 5')).toBe(41);
  });

  it('nhân chia trước, cộng trừ sau', () => {
    expect(evaluate('2 + 3 x 4')).toBe(14);
    expect(evaluate('35 : 5')).toBe(7);
    expect(evaluate('18 ÷ 2 × 3')).toBe(27);
  });

  it('số thập phân dùng dấu phẩy (lớp 5)', () => {
    expect(evaluate('1,5 + 2,25')).toBe(3.75);
  });

  it('chia cho 0 thì không tính', () => {
    expect(evaluate('5 : 0')).toBeNull();
  });
});

describe('checkLine', () => {
  it('bắt phép tính sai và ghi đáp án đúng', () => {
    expect(checkLine('d) 16 - 9 = 8')).toEqual([
      { text: '16 - 9 = 8', solved: '16 - 9 = 7', childAnswer: '8', correctAnswer: '7', correct: false },
    ]);
  });

  it('đọc được chữ dính nhau và có đơn vị phía sau', () => {
    expect(checkLine('c) 2 x7 =16')[0]).toMatchObject({ correctAnswer: '14', correct: false });
    expect(checkLine('h) 35:5 = 7')[0]).toMatchObject({ correct: true });
    expect(checkLine('82 - 47 = 45 (lít)')[0]).toMatchObject({ correctAnswer: '35', correct: false });
  });

  it('một dòng có hai phép tính', () => {
    expect(checkLine('a) 40 + 30 = 70   b) 90 - 50 = 40').map((calc) => calc.correct)).toEqual([true, true]);
  });

  it('bài điền dấu so sánh', () => {
    expect(checkLine('b) 67 > 76')).toEqual([
      { text: '67 > 76', solved: '67 < 76', childAnswer: '>', correctAnswer: '<', correct: false },
    ]);
    expect(checkLine('d) 38 = 38')[0]).toMatchObject({ correct: true });
  });

  it('bỏ qua dòng chữ không có phép tính (ngày tháng, đề bài, đơn vị đo)', () => {
    expect(checkLine('Thứ hai, ngày 13 tháng 10 năm 2026')).toEqual([]);
    expect(checkLine('Bài 2: Mỗi bạn có 5 cái bút. Hỏi 4 bạn có')).toEqual([]);
    expect(checkLine('c) 1 m = 100 cm')).toEqual([]);
  });
});

describe('answerKeyNote', () => {
  it('liệt kê đáp án đúng để gửi kèm cho AI', () => {
    const note = answerKeyNote(checkPage(['d) 16 - 9 = 8', 'b) 67 > 76']));
    expect(note).toContain('- 16 - 9 = 7');
    expect(note).toContain('- 67 < 76');
  });

  it('không có phép tính thì không gửi gì', () => {
    expect(answerKeyNote([])).toBe('');
  });
});
