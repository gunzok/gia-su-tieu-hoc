import { checkLevel } from '@/lib/level-check';

import { makeResult } from '@/test-utils/factories';

describe('checkLevel', () => {
  it('bài đúng lớp của bé thì ok', () => {
    expect(checkLevel(makeResult({ isHomework: true, detectedGrade: 3 }), 3)).toEqual({ kind: 'ok' });
  });

  it('ôn bài lớp ngay dưới vẫn ok', () => {
    expect(checkLevel(makeResult({ isHomework: true, detectedGrade: 2 }), 3)).toEqual({ kind: 'ok' });
  });

  it('lệch lớp thì báo lớp AI nhận ra', () => {
    expect(checkLevel(makeResult({ detectedGrade: 5 }), 3)).toEqual({ kind: 'wrong-grade', detectedGrade: 5 });
    expect(checkLevel(makeResult({ detectedGrade: 1 }), 3)).toEqual({ kind: 'wrong-grade', detectedGrade: 1 });
  });

  it('có lớp AI nhận ra thì không tin fitsGrade', () => {
    expect(checkLevel(makeResult({ detectedGrade: 3, fitsGrade: false }), 3)).toEqual({ kind: 'ok' });
    expect(checkLevel(makeResult({ detectedGrade: 5, fitsGrade: true }), 3)).toEqual({
      kind: 'wrong-grade',
      detectedGrade: 5,
    });
  });

  it('ảnh không phải bài tập', () => {
    expect(checkLevel(makeResult({ isHomework: false, detectedGrade: 3 }), 3)).toEqual({ kind: 'not-homework' });
  });

  it('không rõ lớp: chỉ báo khi AI nói rõ là không hợp', () => {
    expect(checkLevel(makeResult({ detectedGrade: 0, fitsGrade: false }), 3)).toEqual({
      kind: 'wrong-grade',
      detectedGrade: 0,
    });
    expect(checkLevel(makeResult({ detectedGrade: 0, fitsGrade: true }), 3)).toEqual({ kind: 'ok' });
  });

  it('lớp AI trả về không hợp lệ thì coi như không rõ lớp', () => {
    expect(checkLevel(makeResult({ detectedGrade: 7 }), 3)).toEqual({ kind: 'ok' });
    expect(checkLevel(makeResult({ detectedGrade: 2.5 }), 3)).toEqual({ kind: 'ok' });
    expect(checkLevel(makeResult({ detectedGrade: 9, fitsGrade: false }), 3)).toEqual({
      kind: 'wrong-grade',
      detectedGrade: 0,
    });
  });

  it('bài chấm cũ không có các trường nhận biết lớp thì ok', () => {
    expect(checkLevel(makeResult(), 3)).toEqual({ kind: 'ok' });
  });
});
