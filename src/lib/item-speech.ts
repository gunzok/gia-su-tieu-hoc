import type { GradedItem } from '@/lib/grading';
import { speakable } from '@/lib/grading';
import type { Teacher } from '@/lib/teacher';

/** Lời gia sư giảng lại một câu (đọc thành tiếng khi bé bấm nút loa ở câu đó). */
export function itemSpeech(item: GradedItem, number: number, teacher: Teacher) {
  const parts = [`Câu ${number}. ${item.question}.`, `Con làm: ${item.childAnswer}.`];
  if (item.correct) {
    parts.push(`Đúng rồi, con giỏi lắm!`);
    if (item.explanation) parts.push(item.explanation);
  } else {
    if (item.correctAnswer) parts.push(`Đáp án đúng là ${item.correctAnswer}.`);
    parts.push(`${teacher.Title} giảng lại cho con nhé. ${item.explanation}`);
  }
  return speakable(parts.join(' '));
}
