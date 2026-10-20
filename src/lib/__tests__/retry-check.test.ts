import { checkRetry, isNumericAnswer, retryHint } from '@/lib/retry-check';
import { teachers } from '@/lib/teacher';

import { makeItem } from '@/test-utils/factories';

describe('checkRetry', () => {
  it('đáp án số khớp', () => {
    expect(checkRetry('14', '14')).toBe('correct');
    expect(checkRetry(' 14 ', '14.')).toBe('correct');
  });

  it('đáp án dạng phép tính "2 x 7 = 14" → bé gõ 14', () => {
    expect(checkRetry('14', '2 x 7 = 14')).toBe('correct');
    expect(checkRetry('12', '2 x 7 = 14')).toBe('wrong');
  });

  it('cách viết số Việt Nam', () => {
    expect(checkRetry('1000', '1.000')).toBe('correct');
    expect(checkRetry('2,5', '2.5')).toBe('correct');
    expect(checkRetry('1.234,5', '1234.5')).toBe('correct');
  });

  it('đơn vị: quên ghi vẫn đúng, ghi sai đơn vị thì chưa đúng', () => {
    expect(checkRetry('25', '25 cm')).toBe('correct');
    expect(checkRetry('25cm', '25 cm')).toBe('correct');
    expect(checkRetry('25 m', '25 cm')).toBe('wrong');
  });

  it('đáp án đúng là số mà bé gõ chữ thì sai', () => {
    expect(checkRetry('mười bốn', '14')).toBe('wrong');
  });

  it('đáp án chữ: khớp thì đúng, khác thì hỏi cô', () => {
    expect(checkRetry('Con Mèo', 'con mèo.')).toBe('correct');
    expect(checkRetry('con chó', 'con mèo')).toBe('ask');
  });

  it('không có đáp án đúng thì hỏi cô', () => {
    expect(checkRetry('14', undefined)).toBe('ask');
    expect(checkRetry('14', '  ')).toBe('ask');
  });
});

describe('isNumericAnswer', () => {
  it('nhận ra đáp án số', () => {
    expect(isNumericAnswer('14')).toBe(true);
    expect(isNumericAnswer('2 x 7 = 14')).toBe(true);
    expect(isNumericAnswer('con mèo')).toBe(false);
    expect(isNumericAnswer(undefined)).toBe(false);
  });
});

describe('retryHint', () => {
  const item = makeItem({ correct: false, correctAnswer: '14', explanation: 'Hai nhân bảy bằng mười bốn.' });

  it('lần đầu chỉ gợi ý lớn hơn/nhỏ hơn, chưa nói đáp án', () => {
    const hint = retryHint(item, '12', 1, teachers.co);
    expect(hint).toContain('lớn hơn 12');
    expect(hint).not.toContain('14');
  });

  it('từ lần thứ hai thì nói đáp án', () => {
    expect(retryHint(item, '12', 2, teachers.co)).toBe(
      'Gần được rồi con. Đáp án đúng là 14 nhé. Hai nhân bảy bằng mười bốn. Con ghi lại vào vở cho nhớ nha.',
    );
  });
});
