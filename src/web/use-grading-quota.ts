import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Phải khớp freeDailyLimit trong supabase/functions/cham-bai/index.ts. Máy chủ mới là nơi quyết định.
export const FREE_DAILY_GRADINGS = 3;

const vietnamOffsetMs = 7 * 60 * 60 * 1000;

function startOfTodayInVietnam() {
  const vietnamNow = new Date(Date.now() + vietnamOffsetMs);
  vietnamNow.setUTCHours(0, 0, 0, 0);
  return new Date(vietnamNow.getTime() - vietnamOffsetMs);
}

/**
 * Số lượt chấm còn lại hôm nay của gói Miễn phí (đọc từ bảng grading_usage, bé chỉ xem được lượt của mình).
 * null khi chưa biết, hoặc khi đã dùng quá mức Miễn phí (tài khoản Plus): lúc đó không hiện số.
 */
export function useGradingQuota(refreshKey: unknown) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!supabase) return;
        const { count, error } = await supabase
          .from('grading_usage')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfTodayInVietnam().toISOString());
        if (cancelled || error || count === null) return;
        setRemaining(count > FREE_DAILY_GRADINGS ? null : FREE_DAILY_GRADINGS - count);
      })();
      return () => {
        cancelled = true;
      };
      // refreshKey đổi (vừa chấm xong) thì hỏi lại.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]),
  );

  return remaining;
}
