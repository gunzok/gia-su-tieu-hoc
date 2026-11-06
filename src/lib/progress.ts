import { tallyParts } from '../../supabase/functions/_shared/cham-bai';
import { SubjectNames, type Subject } from '@/lib/grading';
import type { HistoryEntry } from '@/lib/history';

export const SubjectIcons: Record<Subject, string> = {
  toan: '🔢',
  'tieng-viet': '📖',
};

export const allSubjects = Object.keys(SubjectNames) as Subject[];

export function averageScore(entries: HistoryEntry[]) {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length;
}

/** Tỉ lệ câu làm đúng trên tổng số câu đã chấm, từ 0 đến 1. */
export function accuracy(entries: HistoryEntry[]) {
  const { correct, total } = tallyParts(entries.flatMap((entry) => entry.items));
  return total === 0 ? null : correct / total;
}

export function scoreLabel(score: number) {
  if (score >= 9) return 'Xuất sắc';
  if (score >= 7) return 'Khá tốt';
  if (score >= 5) return 'Đạt chuẩn';
  return 'Cần luyện thêm';
}

export function praiseForScore(score: number) {
  if (score >= 9) return 'Giỏi quá!';
  if (score >= 7) return 'Khá lắm!';
  if (score >= 5) return 'Cố lên!';
  return 'Cùng sửa nhé!';
}

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 7 ngày của tuần này (thứ Hai → Chủ nhật), đánh dấu ngày nào bé có làm bài. */
export function thisWeek(entries: HistoryEntry[], now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return weekdayLabels.map((label, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return {
      label,
      isToday: sameDay(day, now),
      isFuture: day > now && !sameDay(day, now),
      done: entries.some((entry) => sameDay(new Date(entry.createdAt), day)),
    };
  });
}
