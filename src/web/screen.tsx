import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { BottomBarInset, ContentMaxWidth, NarrowContentWidth, TopBarHeight } from '@/web/constants';
import { useLayout } from '@/web/use-layout';

// Khung chung cho các màn hình web: nền kem, cuộn dọc, giới hạn bề ngang.
// Thanh bên / thanh trên / thanh tab dưới do web/shell.tsx đặt, nên chừa chỗ cho chúng ở đây.
export function Screen({ children }: { children: ReactNode }) {
  const { wide, medium, narrow } = useLayout();
  return (
    <View style={styles.container}>
      <View style={[styles.inner, { maxWidth: narrow ? NarrowContentWidth : ContentMaxWidth }]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            wide && styles.contentWide,
            medium && styles.contentMedium,
            narrow && styles.contentNarrow,
          ]}
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
  content: {
    gap: Spacing.four,
  },
  contentWide: {
    paddingHorizontal: Spacing.five,
    paddingTop: TopBarHeight + Spacing.three,
    paddingBottom: Spacing.six,
  },
  contentMedium: {
    paddingHorizontal: Spacing.four,
    paddingTop: TopBarHeight + Spacing.three,
    paddingBottom: Spacing.five,
  },
  contentNarrow: {
    paddingHorizontal: Spacing.three + 4,
    paddingTop: TopBarHeight + Spacing.two,
    paddingBottom: BottomBarInset + Spacing.five,
  },
});
