import type { GradedItem } from '@/lib/grading';
import { speakable } from '@/lib/grading';
import type { Teacher } from '@/lib/teacher';

// Câu khen ngắn, đổi theo số câu để nghe nhiều câu liền không bị lặp.
const praises = ['Đúng rồi, con giỏi quá!', 'Con làm đúng rồi đấy!', 'Chính xác, giỏi lắm con!', 'Đúng rồi nhé, tốt lắm!'];

/**
 * Lời gia sư giảng lại một câu (đọc thành tiếng khi bé bấm nút loa ở câu đó).
 * Nói như cô giáo đang chữa bài, không đọc lại nguyên đề và bài làm như máy.
 */
export function itemSpeech(item: GradedItem, number: number, teacher: Teacher) {
  if (item.correct) {
    return speakable(`Câu ${number} nhé. ${praises[(number - 1) % praises.length]} ${item.explanation ?? ''}`);
  }
  const parts = [`Câu ${number}, mình cùng xem lại nhé.`];
  if (item.correctAnswer && item.correctAnswer.length <= 40 && item.childAnswer.length <= 40) {
    parts.push(`Con ghi ${item.childAnswer}, nhưng kết quả đúng là ${item.correctAnswer}.`);
  }
  parts.push(item.explanation || `${teacher.Title} giảng lại cho con nghe nhé.`);
  return speakable(parts.join(' '));
}
