import { toLines } from '@/lib/read-page-text';

describe('toLines', () => {
  it('tách khối chữ nhiều dòng và bỏ dòng trống', () => {
    expect(toLines(['Bài 1: Tính:\n 5 + 3 = 8 \n', '', 'b) 2 x 3 = 6'])).toEqual([
      'Bài 1: Tính:',
      '5 + 3 = 8',
      'b) 2 x 3 = 6',
    ]);
  });
});
