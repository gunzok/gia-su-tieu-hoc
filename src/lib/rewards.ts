// Sao thưởng và chuỗi ngày học của bé. Chỉ có hàm thuần; lưu trữ nằm ở lib/profile.tsx.

/** Số sao bé nhận sau mỗi bài chấm xong. */
export const STARS_PER_GRADING = 15;

export type Rewards = {
  stars: number;
  /** Số ngày học liên tiếp, tính đến ngày `lastStudyDay`. */
  streak: number;
  /** Ngày học gần nhất theo giờ máy, dạng "YYYY-MM-DD"; null nếu chưa học bài nào. */
  lastStudyDay: string | null;
};

export const emptyRewards: Rewards = { stars: 0, streak: 0, lastStudyDay: null };

/** Ngày theo giờ máy của bé (không theo UTC), dạng "YYYY-MM-DD". */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Số ngày lịch từ `from` đến `to` (cả hai dạng "YYYY-MM-DD"); đổi giờ mùa hè không làm lệch.
function daysBetween(from: string, to: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/**
 * Chuỗi ngày đang hiện cho bé: còn giữ nếu hôm nay hoặc hôm qua có học,
 * bỏ qua một ngày thì về 0.
 */
export function currentStreak(rewards: Rewards, now: Date): number {
  if (!rewards.lastStudyDay) return 0;
  const gap = daysBetween(rewards.lastStudyDay, dayKey(now));
  return gap === 0 || gap === 1 ? rewards.streak : 0;
}

/** Cộng sao và cập nhật chuỗi ngày sau một bài chấm xong. Nhiều bài trong một ngày chỉ tính 1 ngày. */
export function applyGrading(rewards: Rewards, now: Date): Rewards {
  const today = dayKey(now);
  const gap = rewards.lastStudyDay ? daysBetween(rewards.lastStudyDay, today) : null;
  let streak: number;
  if (gap === 0) streak = Math.max(rewards.streak, 1);
  else if (gap === 1) streak = rewards.streak + 1;
  // Chưa học bao giờ, bỏ ngày, hoặc đồng hồ máy bị chỉnh lùi: bắt đầu chuỗi mới.
  else streak = 1;
  return { stars: rewards.stars + STARS_PER_GRADING, streak, lastStudyDay: today };
}

/** Đọc dữ liệu đã lưu; hỏng hoặc thiếu thì coi như chưa có sao. */
export function parseRewards(raw: string | null): Rewards {
  if (!raw) return emptyRewards;
  try {
    const value = JSON.parse(raw) as Partial<Rewards>;
    return {
      stars: Number.isFinite(value.stars) ? Math.max(0, Math.floor(value.stars!)) : 0,
      streak: Number.isFinite(value.streak) ? Math.max(0, Math.floor(value.streak!)) : 0,
      lastStudyDay:
        typeof value.lastStudyDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastStudyDay)
          ? value.lastStudyDay
          : null,
    };
  } catch {
    return emptyRewards;
  }
}
