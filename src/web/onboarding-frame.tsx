import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';
import { ContentMaxWidth } from '@/web/constants';
import { LegalLinks } from '@/web/legal-links';
import { useLayout } from '@/web/use-layout';

type Props = {
  children: ReactNode;
  /** Tiêu đề giữa thanh trên (máy tính); điện thoại hiện dưới logo. */
  title?: string;
  /** Hiện nút quay lại khi có màn trước. */
  back?: boolean;
  /** Bấm "Bỏ qua"; không truyền thì không hiện. */
  onSkip?: () => void;
  /** Nút phụ bên phải thanh trên, ví dụ "Đăng nhập" ở màn Khởi động. */
  action?: { label: string; onPress: () => void };
};

// Khung các màn trước khi vào app trên web (Khởi động, Đăng nhập Ba Mẹ, Hồ sơ của bé), theo Stitch
// "Web App v2": thanh trên có logo, nội dung nhiều cột giới hạn bề ngang, chân trang có link pháp lý.
// Chưa có hồ sơ bé nên không có thanh bên như các màn trong app (web/shell.tsx).
export function OnboardingFrame({ children, title, back, onSkip, action }: Props) {
  const { narrow } = useLayout();
  const canGoBack = back && router.canGoBack();

  return (
    <View style={styles.page}>
      <View style={[styles.topBar, narrow && styles.topBarNarrow]}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <MaterialIcons name="menu-book" size={24} color={Palette.blue} />
          </View>
          <View>
            <AppText variant="labelLg" color={Palette.blue}>
              {APP_NAME}
            </AppText>
            {!narrow && (
              <AppText variant="bodySm" color={Palette.inkSoft}>
                Đồng hành cùng bé học giỏi
              </AppText>
            )}
          </View>
        </View>
        {title && !narrow && (
          <AppText variant="headlineSm" accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
        )}
        <View style={styles.actions}>
          {canGoBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
              <MaterialIcons name="arrow-back" size={22} color={Palette.ink} />
            </Pressable>
          )}
          {onSkip && (
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
              <AppText variant="labelMd">Bỏ qua</AppText>
            </Pressable>
          )}
          {action && (
            <Pressable
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [styles.pill, styles.pillStrong, pressed && styles.pressed]}>
              <AppText variant="labelLg" color={Palette.blue}>
                {action.label}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.content, narrow && styles.contentNarrow]}>
          {title && narrow && (
            <AppText variant="headlineMd" accessibilityRole="header">
              {title}
            </AppText>
          )}
          {children}
        </View>
        <View style={styles.footer}>
          <LegalLinks />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  topBarNarrow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillStrong: {
    borderWidth: 2,
    borderColor: Palette.blue,
  },
  pressed: {
    opacity: 0.85,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: ContentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.five,
    gap: Spacing.four,
    justifyContent: 'center',
  },
  contentNarrow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  footer: {
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surface,
  },
});
