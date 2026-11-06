import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { BottomBarInset, DesktopContentWidth, NarrowContentWidth, TopBarHeight } from '@/web/constants';
import { useIsDesktop } from '@/web/use-layout';

// Khung chung cho các màn hình web: nền kem, cuộn dọc, giới hạn bề ngang.
// Thanh bên / thanh trên / thanh tab dưới do web/shell.tsx đặt, nên chừa chỗ cho chúng ở đây.
export function Screen({ children }: { children: ReactNode }) {
  const desktop = useIsDesktop();
  return (
    <View style={styles.container}>
      <View style={[styles.inner, { maxWidth: desktop ? DesktopContentWidth : NarrowContentWidth }]}>
        <ScrollView
          contentContainerStyle={desktop ? styles.contentDesktop : styles.contentNarrow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  inner: {
    flex: 1,
  },
  contentDesktop: {
    paddingHorizontal: Spacing.five,
    paddingTop: TopBarHeight + Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  contentNarrow: {
    paddingHorizontal: Spacing.three + 4,
    paddingTop: TopBarHeight + Spacing.three,
    paddingBottom: BottomBarInset + Spacing.five,
    gap: Spacing.four,
  },
});
