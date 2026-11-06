import {
  duplicatePages,
  itemParts,
  scoreFromItems,
  tallyParts,
  labelPageItems,
  mergePages,
  needsRegrade,
  pageAsk,
  summaryAsk,
} from '../../../supabase/functions/_shared/cham-bai';

import { makeItem, makeResult } from '@/test-utils/factories';

describe('pageAsk', () => {
  it('bài một trang giữ nguyên lời nhờ chấm', () => {
    expect(pageAsk('co', 1, 1)).toBe('Cô chấm bài này giúp con nhé.');
    expect(pageAsk('thay', 1, 1)).toBe('Thầy chấm bài này giúp con nhé.');
  });

  it('bài nhiều trang nói rõ đang chấm trang mấy và chỉ chấm trang đó', () => {
    const ask = pageAsk('co', 2, 3);
    expect(ask).toContain('trang 2 trên 3 trang');
    expect(ask).toContain('Chỉ chấm các bài trên trang này');
    expect(ask).toContain('Trang 2 – ');
  });
});

describe('labelPageItems', () => {
  it('thêm số trang vào đầu câu hỏi', () => {
    const result = labelPageItems(makeResult({ items: [makeItem({ question: 'Bài 1: 2 x 7' })] }), 3);
    expect(result.items[0].question).toBe('Trang 3 – Bài 1: 2 x 7');
  });

  it('không thêm lần nữa khi AI đã ghi số trang', () => {
    const result = labelPageItems(makeResult({ items: [makeItem({ question: 'Trang 3 – Bài 1' })] }), 3);
    expect(result.items[0].question).toBe('Trang 3 – Bài 1');
  });
});

describe('needsRegrade', () => {
  it('trang không có bài nào thì chấm lại', () => {
    expect(needsRegrade(makeResult({ items: [] }))).toBe(true);
  });

  it('trang có bài thì không chấm lại', () => {
    expect(needsRegrade(makeResult())).toBe(false);
  });
});

describe('mergePages', () => {
  it('gộp đủ bài của mọi trang theo đúng thứ tự trang', () => {
    const merged = mergePages([
      makeResult({ items: [makeItem({ question: 'Trang 1 – Bài 1' })] }),
      makeResult({ items: [makeItem({ question: 'Trang 2 – Bài 1' }), makeItem({ question: 'Trang 2 – Bài 2' })] }),
      makeResult({ items: [makeItem({ question: 'Trang 3 – Bài 1' })] }),
    ]);
    expect(merged.items.map((item) => item.question)).toEqual([
      'Trang 1 – Bài 1',
      'Trang 2 – Bài 1',
      'Trang 2 – Bài 2',
      'Trang 3 – Bài 1',
    ]);
  });

  it('tính điểm theo số câu đúng của cả bài, làm tròn 0,5', () => {
    const merged = mergePages([
      makeResult({ score: 10, items: [makeItem(), makeItem()] }),
      makeResult({ score: 0, items: [makeItem({ correct: false })] }),
    ]);
    // 2/3 × 10 = 6,67 → 6,5
    expect(merged.score).toBe(6.5);
  });

  it('bỏ qua trang không phải bài tập (ví dụ trang bìa) nếu trang khác là bài tập', () => {
    const merged = mergePages([
      makeResult({ isHomework: false, detectedGrade: 0, items: [], spokenFeedback: 'Con chụp lại nhé.' }),
      makeResult({ isHomework: true, detectedGrade: 2, fitsGrade: true, spokenFeedback: 'Giỏi lắm.' }),
    ]);
    expect(merged.isHomework).toBe(true);
    expect(merged.detectedGrade).toBe(2);
    expect(merged.items).toHaveLength(1);
    expect(merged.spokenFeedback).toBe('Giỏi lắm.');
  });

  it('mọi trang đều không phải bài tập thì trả kết quả "không phải bài tập"', () => {
    const merged = mergePages([
      makeResult({ isHomework: false, items: [], spokenFeedback: 'Con chụp lại bài làm nhé.' }),
      makeResult({ isHomework: false, items: [] }),
    ]);
    expect(merged.isHomework).toBe(false);
    expect(merged.score).toBe(0);
    expect(merged.items).toEqual([]);
    expect(merged.spokenFeedback).toBe('Con chụp lại bài làm nhé.');
  });

  it('lớp nhận ra là lớp gặp nhiều nhất giữa các trang', () => {
    const merged = mergePages([
      makeResult({ detectedGrade: 3, fitsGrade: true }),
      makeResult({ detectedGrade: 4, fitsGrade: false }),
      makeResult({ detectedGrade: 3, fitsGrade: true }),
    ]);
    expect(merged.detectedGrade).toBe(3);
    expect(merged.fitsGrade).toBe(true);
  });

  it('chỉ báo "không hợp lớp" khi đa số trang không hợp lớp', () => {
    expect(mergePages([makeResult({ fitsGrade: false }), makeResult({ fitsGrade: true })]).fitsGrade).toBe(true);
    expect(mergePages([makeResult({ fitsGrade: false }), makeResult({ fitsGrade: false })]).fitsGrade).toBe(false);
  });

  it('lời nhận xét tạm ghép từ các trang (dùng khi bước tổng kết lỗi)', () => {
    const merged = mergePages([
      makeResult({ spokenFeedback: 'Trang một tốt.', parentNote: 'Ghi chú 1' }),
      makeResult({ spokenFeedback: 'Trang hai tốt.', parentNote: 'Ghi chú 2' }),
    ]);
    expect(merged.spokenFeedback).toBe('Trang một tốt. Trang hai tốt.');
    expect(merged.parentNote).toBe('Ghi chú 1\nGhi chú 2');
  });
});

describe('summaryAsk', () => {
  it('đưa kết quả từng bài cho AI viết lời nhận xét chung, không chấm lại', () => {
    const ask = summaryAsk(
      mergePages([makeResult({ items: [makeItem({ question: 'Trang 1 – Bài 1', correct: false })] })]),
      'co',
    );
    expect(ask).toContain('Trang 1 – Bài 1');
    expect(ask).toContain('Không chấm lại');
    expect(ask).toContain('spokenFeedback');
  });
});

describe('duplicatePages', () => {
  const pageA = () =>
    makeResult({
      items: [
        makeItem({ question: 'Trang 1 – Bài 1: 38 + 46', childAnswer: '74' }),
        makeItem({ question: 'Trang 1 – Bài 2: 16 - 9', childAnswer: '8' }),
        makeItem({ question: 'Trang 1 – Bài 3: 47 + 25', childAnswer: '72' }),
      ],
    });

  it('trang chụp lại (cùng đề, cùng bài làm) bị coi là trùng, dù AI ghi khác số trang và dấu câu', () => {
    const again = makeResult({
      items: [
        makeItem({ question: 'Trang 3 – Bài 1: 38 + 46.', childAnswer: '74' }),
        makeItem({ question: 'Trang 3 – bài 2: 16 - 9', childAnswer: ' 8' }),
        makeItem({ question: 'Trang 3 – Bài 3: 47 + 25', childAnswer: '72' }),
      ],
    });
    expect(duplicatePages([pageA(), makeResult({ items: [makeItem({ question: 'Bài 1: 5 x 4' })] }), again])).toEqual([3]);
  });

  it('cùng mẫu đề nhưng bé làm khác thì không trùng', () => {
    const other = makeResult({
      items: [
        makeItem({ question: 'Trang 2 – Bài 1: 38 + 46', childAnswer: '84' }),
        makeItem({ question: 'Trang 2 – Bài 2: 16 - 9', childAnswer: '7' }),
        makeItem({ question: 'Trang 2 – Bài 3: 47 + 25', childAnswer: '72' }),
      ],
    });
    expect(duplicatePages([pageA(), other])).toEqual([]);
  });

  it('trang không có bài nào không bị coi là trùng', () => {
    expect(duplicatePages([makeResult({ items: [] }), makeResult({ items: [] })])).toEqual([]);
  });
});

describe('điểm bài nhiều phần (GIA-55)', () => {
  const bai1 = makeItem({
    correct: false,
    childAnswer: 'a) 2 x 3 = 6; b) 5 x 4 = 20; c) 2 x 7 = 16; d) 5 x 6 = 30; e) 2 x 9 = 18; g) 10 : 2 = 5; h) 35 : 5 = 7; i) 18 : 2 = 8',
    correctAnswer: 'a) 2 x 3 = 6; b) 5 x 4 = 20; c) 2 x 7 = 14; d) 5 x 6 = 30; e) 2 x 9 = 18; g) 10 : 2 = 5; h) 35 : 5 = 7; i) 18 : 2 = 9',
  });

  it('6/8 phép đúng và một bài đúng thì được 8 điểm, không phải 5', () => {
    expect(tallyParts([bai1, makeItem()])).toEqual({ correct: 7, total: 9 });
    expect(scoreFromItems([bai1, makeItem()])).toBe(8);
  });

  it('chỉ đánh dấu sai đúng các phần sai', () => {
    expect(itemParts(bai1)?.filter((part) => !part.correct).map((part) => part.right)).toEqual([
      'c) 2 x 7 = 14',
      'i) 18 : 2 = 9',
    ]);
  });

  it('tách được phần theo từng dòng, bỏ qua khác biệt khoảng trắng và dấu nhân', () => {
    const item = makeItem({ correct: false, childAnswer: '2 × 3 = 6\n4 + 4 = 9', correctAnswer: '2 x 3 = 6\n4 + 4 = 8' });
    expect(itemParts(item)?.map((part) => part.correct)).toEqual([true, false]);
  });

  it('không tách được thì giữ kết luận của AI', () => {
    expect(itemParts(makeItem({ correct: false, childAnswer: 'a; b', correctAnswer: 'a; b; c' }))).toBeNull();
    expect(itemParts(makeItem({ correct: false, childAnswer: 'chưa làm', correctAnswer: '14' }))).toBeNull();
    // AI chấm sai mà hai bên giống hệt: có thể sai ở chỗ khác (bài văn, nét vẽ).
    expect(itemParts(makeItem({ correct: false, childAnswer: 'a; b', correctAnswer: 'a; b' }))).toBeNull();
    expect(tallyParts([makeItem({ correct: false, childAnswer: 'chưa làm' })])).toEqual({ correct: 0, total: 1 });
  });

  it('AI chấm đúng thì mọi phần đều đúng', () => {
    const item = makeItem({ correct: true, childAnswer: 'x; y', correctAnswer: 'x ; z' });
    expect(tallyParts([item])).toEqual({ correct: 2, total: 2 });
  });
});
