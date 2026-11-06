import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/web/use-layout';

type Props = {
  main: ReactNode;
  aside: ReactNode;
  /** Tỉ lệ bề ngang cột chính so với cột phụ (mặc định 1.6 : 1). */
  ratio?: number;
};

// Trên máy tính: cột chính bên trái, cột phụ bên phải. Trên điện thoại: xếp dọc, cột chính trước.
export function Columns({ main, aside, ratio = 1.6 }: Props) {
  const desktop = useIsDesktop();
  if (!desktop) {
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
      <View style={[styles.column, { flexGrow: 1, flexBasis: 0 }]}>{aside}</View>
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
