import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';

// Đăng nhập thật (Google, Apple, số điện thoại, mã trường) chưa làm: cần máy chủ tài khoản
// và bản app build riêng. Tạm thời các nút chỉ báo "sắp có"; "Bỏ qua" đi tiếp tới Hồ sơ của bé.
function comingSoon() {
  Alert.alert(
    'Sắp có nhé!',
    'Tính năng đăng nhập đang được chuẩn bị. Ba mẹ bấm "Bỏ qua" để dùng app ngay, kết quả vẫn được lưu trên máy này.',
  );
}

const skipToProfile = () => router.push('/ho-so');

// Thiết kế Stitch "Đăng nhập Ba Mẹ - SSO Google".
export default function ParentLoginScreen() {
  return (
    <Screen>
      <OnboardingHeader title="Ba Mẹ đăng nhập" onSkip={skipToProfile} />

      <Card style={styles.welcome}>
        <View style={styles.avatarWrap}>
          <Mascot size={120} background={Palette.white} />
          <View style={styles.sparkle}>
            <MaterialIcons name="auto-awesome" size={18} color={Palette.amberInk} />
          </View>
        </View>
        <View style={styles.portalTag}>
          <View style={styles.dot} />
          <AppText variant="labelSm" color={Palette.blue}>
            CỔNG THÔNG TIN PHỤ HUYNH
          </AppText>
        </View>
        <AppText variant="headlineLg" style={styles.center}>
          Chào mừng Ba Mẹ! 👋
        </AppText>
        <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
          Đăng nhập để đồng hành cùng con và theo dõi tiến độ mỗi ngày thật dễ dàng.
        </AppText>
        <View style={styles.note}>
          <View style={styles.noteIcon}>
            <MaterialIcons name="favorite-border" size={20} color={Palette.blue} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelMd" color={Palette.blue}>
              Cô Giáo Nhí nhắn gửi:
            </AppText>
            <AppText variant="bodySm">“Con sẽ được hướng dẫn học từng bước nhẹ nhàng, vui vẻ và không áp lực!”</AppText>
          </View>
        </View>
      </Card>

      <View style={styles.buttons}>
        <LoginButton
          icon={<FontAwesome name="google" size={22} color="#4285F4" />}
          label="Tiếp tục với Google"
          tint={Palette.white}
          bordered
        />
        <LoginButton
          icon={<FontAwesome name="apple" size={24} color={Palette.ink} />}
          label="Đăng nhập bằng Apple"
          tint={Palette.surfaceStrong}
        />
        <LoginButton
          icon={<MaterialIcons name="smartphone" size={24} color={Palette.ink} />}
          label="Đăng nhập bằng Số điện thoại"
          tint={Palette.surfaceMuted}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <AppText variant="bodySm" color={Palette.inkSoft}>
          hoặc đăng nhập nhanh qua
        </AppText>
        <View style={styles.divider} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={comingSoon}
        style={({ pressed }) => [styles.schoolRow, pressed && styles.pressed]}>
        <View style={styles.schoolIcon}>
          <MaterialIcons name="school" size={24} color={Palette.amberInk} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">Tài khoản Trường học / Lớp học</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Dùng mã liên kết do nhà trường cung cấp
          </AppText>
        </View>
        <MaterialIcons name="chevron-right" size={26} color={Palette.inkSoft} />
      </Pressable>

      <View style={styles.safety}>
        <View style={styles.safetyIcon}>
          <MaterialIcons name="verified-user" size={24} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">An toàn & bảo mật cho trẻ em</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Bài làm và kết quả của bé chỉ lưu trên máy này. Ảnh chỉ gửi đi để chấm bài.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

function LoginButton({
  icon,
  label,
  tint,
  bordered,
}: {
  icon: ReactNode;
  label: string;
  tint: string;
  bordered?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={comingSoon}
      style={({ pressed }) => [
        styles.loginButton,
        { backgroundColor: tint },
        bordered && styles.loginButtonBordered,
        pressed && styles.pressed,
      ]}>
      {icon}
      <AppText variant="labelLg">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  welcome: {
    alignItems: 'center',
  },
  avatarWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.surfaceStrong,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.blue,
  },
  note: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    gap: Spacing.three,
  },
  loginButton: {
    minHeight: 60,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  loginButtonBordered: {
    borderWidth: 1,
    borderColor: Palette.border,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.three,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  safetyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
