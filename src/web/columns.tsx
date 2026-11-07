import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useLayout } from '@/web/use-layout';

type Props = {
  main: ReactNode;
  aside: ReactNode;
  /** Tỉ lệ bề ngang cột chính so với cột phụ (mặc định 1.6 : 1). */
  ratio?: number;
  /** Từ cỡ nào thì chia hai cột: "wide" (máy tính) hoặc "medium" (cả máy gập mở ra). */
  from?: 'wide' | 'medium';
  /** Cột phụ cuộn theo trang (sticky) trên máy tính. */
  stickyAside?: boolean;
};

// Chia hai cột (cột chính trái, cột phụ phải); cỡ hẹp thì xếp dọc, cột chính trước.
export function Columns({ main, aside, ratio = 1.6, from = 'wide', stickyAside }: Props) {
  const { wide, medium } = useLayout();
  const split = from === 'wide' ? wide : wide || medium;
  if (!split) {
    return (
      <>
        {main}
        {aside}
      </>
    );
  }
  return (
    <View style={styles.row}>
      <View style={[styles.column, { flexGrow: ratio, flexBasis: 0 }]}>{main}</View>
      <View
        style={[
          styles.column,
          { flexGrow: 1, flexBasis: 0 },
          // Chỉ có trên trình duyệt: cột phụ dính lại khi cuộn.
          stickyAside && ({ position: 'sticky', top: 104 } as object),
        ]}>
        {aside}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    minWidth: 0,
    gap: Spacing.four,
  },
});
