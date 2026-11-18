import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

// Chiều cao chừa cho nút dính đáy (nút lớn 60 + khoảng cách), để nội dung cuộn không bị nút che.
const FOOTER_SPACE = 60 + Spacing.four;

type Props = {
  children: ReactNode;
  /** Nút chính dính đáy, nằm ngay trên thanh tab (không cuộn theo nội dung). */
  footer?: ReactNode;
};

// Khung chung cho mọi màn hình: nền kem, tránh tai thỏ, cuộn dọc, giới hạn bề ngang.
export function Screen({ children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.content, footer ? { paddingBottom: styles.content.paddingBottom + FOOTER_SPACE } : null]}
          showsVerticalScrollIndicator={false}
          // Ô nhập (ví dụ "Thử lại câu này") không bị bàn phím che; bấm nút lúc bàn phím đang mở vẫn ăn.
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
      {footer ? (
        <View pointerEvents="box-none" style={[styles.footer, { bottom: insets.bottom + BottomTabInset + Spacing.two }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
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
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three + 4,
  },
});
