import { normalizeResult, speakable } from '@/lib/grading';

import { makeItem, makeResult } from '@/test-utils/factories';

jest.mock('@/lib/supabase', () => ({ supabase: null, ensureSession: jest.fn() }));

describe('speakable', () => {
  it('đọc phép nhân và dấu bằng thành chữ', () => {
    expect(speakable('2 x 7 = 14')).toBe('2 nhân 7 bằng 14');
    expect(speakable('3×4=12')).toBe('3 nhân 4 bằng 12');
  });

  it('đọc phép cộng, trừ, chia thành chữ', () => {
    expect(speakable('5 + 3 = 8')).toBe('5 cộng 3 bằng 8');
    expect(speakable('9 − 4 = 5')).toBe('9 trừ 4 bằng 5');
    expect(speakable('9 - 4 = 5')).toBe('9 trừ 4 bằng 5');
    expect(speakable('12 ÷ 3 = 4')).toBe('12 chia 3 bằng 4');
    expect(speakable('12 : 3 = 4')).toBe('12 chia 3 bằng 4');
  });

  it('giữ nguyên chữ x và gạch nối không nằm giữa hai số', () => {
    expect(speakable('Tìm x biết x + 2 = 5')).toBe('Tìm x biết x + 2 bằng 5');
    expect(speakable('bài 1-2')).toBe('bài 1-2');
    expect(speakable('Lúc 8:30')).toBe('Lúc 8:30');
  });

  it('câu không có phép tính thì giữ nguyên', () => {
    expect(speakable('Con giỏi quá!')).toBe('Con giỏi quá!');
    expect(speakable('')).toBe('');
  });
});

describe('normalizeResult', () => {
  it('tính lại điểm theo số câu đúng, làm tròn 0,5', () => {
    const result = makeResult({
      score: 10,
      items: [makeItem(), makeItem(), makeItem({ correct: false })],
    });
    // 2/3 × 10 = 6,67 → 6,5
    expect(normalizeResult(result).score).toBe(6.5);
  });

  it('đổi phép tính trong lời nhận xét thành chữ', () => {
    const result = makeResult({ spokenFeedback: 'Câu 1: 2 x 7 = 14 là đúng rồi.' });
    expect(normalizeResult(result).spokenFeedback).toBe('Câu 1: 2 nhân 7 bằng 14 là đúng rồi.');
  });

  it('không có câu nào thì giữ điểm AI chấm', () => {
    const result = makeResult({ score: 7, items: [] });
    expect(normalizeResult(result).score).toBe(7);
  });

  it('không sửa đối tượng gốc', () => {
    const result = makeResult({ score: 3 });
    normalizeResult(result);
    expect(result.score).toBe(3);
  });
});
