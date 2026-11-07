import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Spacing } from '@/constants/theme';

// Dòng liên kết Chính sách / Điều khoản ở cuối trang (GIA-71).
// Đường dẫn của route chỉ có trên web (*.web.tsx) chưa có trong kiểu route tự sinh, nên ép kiểu.
const privacyHref = '/chinh-sach' as never;
const termsHref = '/dieu-khoan' as never;

export function LegalLinks() {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="link" onPress={() => router.navigate(privacyHref)} style={styles.link}>
        <AppText variant="labelSm" color={Palette.inkSoft}>
          Chính sách quyền riêng tư
        </AppText>
      </Pressable>
      <AppText variant="labelSm" color={Palette.inkSoft}>
        ·
      </AppText>
      <Pressable accessibilityRole="link" onPress={() => router.navigate(termsHref)} style={styles.link}>
        <AppText variant="labelSm" color={Palette.inkSoft}>
          Điều khoản sử dụng
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.one },
});
