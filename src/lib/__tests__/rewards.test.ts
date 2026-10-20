import {
  STARS_PER_GRADING,
  applyGrading,
  currentStreak,
  dayKey,
  emptyRewards,
  parseRewards,
  streakMessage,
  type Rewards,
} from '@/lib/rewards';

// Giờ máy của bé (ngày, tháng tính từ 1).
const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h);

describe('dayKey', () => {
  it('lấy ngày theo giờ máy, kể cả lúc gần nửa đêm', () => {
    expect(dayKey(at(2026, 10, 5, 23))).toBe('2026-10-05');
    expect(dayKey(at(2026, 1, 1, 0))).toBe('2026-01-01');
  });
});

describe('applyGrading', () => {
  it('bài đầu tiên: +15 sao, chuỗi 1 ngày', () => {
    expect(applyGrading(emptyRewards, at(2026, 10, 20))).toEqual({
      stars: STARS_PER_GRADING,
      streak: 1,
      lastStudyDay: '2026-10-20',
    });
  });

  it('mỗi bài đều cộng sao, nhưng nhiều bài trong một ngày chỉ tính 1 ngày', () => {
    let rewards = applyGrading(emptyRewards, at(2026, 10, 20, 8));
    rewards = applyGrading(rewards, at(2026, 10, 20, 15));
    rewards = applyGrading(rewards, at(2026, 10, 20, 21));
    expect(rewards).toEqual({ stars: 45, streak: 1, lastStudyDay: '2026-10-20' });
  });

  it('học ngày kế tiếp thì chuỗi tăng, kể cả qua tháng và qua năm', () => {
    let rewards = applyGrading(emptyRewards, at(2026, 12, 30));
    rewards = applyGrading(rewards, at(2026, 12, 31));
    rewards = applyGrading(rewards, at(2027, 1, 1));
    expect(rewards.streak).toBe(3);
    expect(rewards.stars).toBe(45);
  });

  it('học lúc 23 giờ rồi 0 giờ hôm sau vẫn là hai ngày liên tiếp', () => {
    const rewards = applyGrading(applyGrading(emptyRewards, at(2026, 10, 20, 23)), at(2026, 10, 21, 0));
    expect(rewards.streak).toBe(2);
  });

  it('bỏ một ngày thì chuỗi bắt đầu lại từ 1, sao vẫn giữ', () => {
    const before: Rewards = { stars: 60, streak: 4, lastStudyDay: '2026-10-18' };
    expect(applyGrading(before, at(2026, 10, 20))).toEqual({
      stars: 75,
      streak: 1,
      lastStudyDay: '2026-10-20',
    });
  });

  it('đồng hồ máy bị chỉnh lùi thì bắt đầu chuỗi mới, không tăng', () => {
    const before: Rewards = { stars: 30, streak: 2, lastStudyDay: '2026-10-20' };
    expect(applyGrading(before, at(2026, 10, 15))).toMatchObject({ streak: 1, lastStudyDay: '2026-10-15' });
  });
});

describe('currentStreak', () => {
  const rewards: Rewards = { stars: 75, streak: 5, lastStudyDay: '2026-10-20' };

  it('chưa học bài nào thì 0', () => {
    expect(currentStreak(emptyRewards, at(2026, 10, 20))).toBe(0);
  });

  it('học hôm nay hoặc hôm qua thì vẫn giữ chuỗi', () => {
    expect(currentStreak(rewards, at(2026, 10, 20, 22))).toBe(5);
    expect(currentStreak(rewards, at(2026, 10, 21, 7))).toBe(5);
  });

  it('bỏ một ngày thì về 0', () => {
    expect(currentStreak(rewards, at(2026, 10, 22))).toBe(0);
  });
});

describe('streakMessage', () => {
  it('chưa có chuỗi thì rủ bé bắt đầu', () => {
    expect(streakMessage(emptyRewards, at(2026, 10, 20))).toMatch(/bắt đầu/);
  });

  it('hôm qua có học, hôm nay chưa thì nhắc giữ chuỗi', () => {
    const rewards: Rewards = { stars: 75, streak: 5, lastStudyDay: '2026-10-19' };
    expect(streakMessage(rewards, at(2026, 10, 20))).toBe('Chấm 1 bài hôm nay để giữ chuỗi 5 ngày nhé!');
  });

  it('hôm nay đã học thì khen', () => {
    const rewards: Rewards = { stars: 75, streak: 5, lastStudyDay: '2026-10-20' };
    expect(streakMessage(rewards, at(2026, 10, 20))).toBe('Con học 5 ngày liền rồi, giỏi quá!');
  });
});

describe('parseRewards', () => {
  it('chưa lưu hoặc dữ liệu hỏng thì coi như chưa có sao', () => {
    expect(parseRewards(null)).toEqual(emptyRewards);
    expect(parseRewards('{không phải json')).toEqual(emptyRewards);
  });

  it('đọc lại đúng dữ liệu đã lưu và sửa giá trị lạ', () => {
    const saved: Rewards = { stars: 30, streak: 2, lastStudyDay: '2026-10-20' };
    expect(parseRewards(JSON.stringify(saved))).toEqual(saved);
    expect(parseRewards('{"stars":-5,"streak":"3","lastStudyDay":"hôm qua"}')).toEqual(emptyRewards);
  });
});
