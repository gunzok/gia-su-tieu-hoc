import type { GradedItem, GradingResult } from '@/lib/grading';

export function makeItem(overrides: Partial<GradedItem> = {}): GradedItem {
  return {
    question: '2 x 7 = ?',
    childAnswer: '14',
    correctAnswer: '14',
    correct: true,
    explanation: 'Hai nhân bảy bằng mười bốn.',
    ...overrides,
  };
}

export function makeResult(overrides: Partial<GradingResult> = {}): GradingResult {
  return {
    score: 10,
    spokenFeedback: 'Con làm tốt lắm!',
    items: [makeItem()],
    parentNote: '',
    ...overrides,
  };
}
