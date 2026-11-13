import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Screen } from '@/components/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { sendEmailCode, signInWithGoogle, useAuth, verifyEmailCode } from '@/lib/auth';
import { cleanEmailCode, EMAIL_CODE_MAX, isValidEmailCode } from '@/lib/email-code';
import { useProfile } from '@/lib/profile';
import { APP_NAME } from '@/lib/teacher';

// Apple, số điện thoại và mã trường chưa làm (Apple cần tài khoản Apple Developer,
// SMS cần dịch vụ trả phí). Các nút đó tạm báo "sắp có".
function comingSoon() {
  Alert.alert('Sắp có nhé!', 'Cách đăng nhập này đang được chuẩn bị. Ba mẹ dùng email hoặc Google trước nhé.');
}

function showError(error: unknown) {
  Alert.alert('Chưa đăng nhập được', error instanceof Error ? error.message : String(error));
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Thiết kế Stitch "Đăng nhập Ba Mẹ - SSO Google". Mở được lúc mới cài app (trước Hồ sơ của bé)
// và từ tab Tiến độ (khi đã có hồ sơ).
export default function ParentLoginScreen() {
  const { configured } = useAuth();
  const { profile, syncAfterSignIn } = useProfile();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState<'email' | 'code' | 'google' | null>(null);

  function leave() {
    if (profile && router.canGoBack()) router.back();
    else router.push('/ho-so');
  }

  // Đăng nhập xong: lấy hồ sơ bé trên máy chủ về. Có hồ sơ thì vào thẳng app, chưa có thì tạo.
  async function afterSignIn() {
    const synced = await syncAfterSignIn();
    if (!synced) router.replace('/ho-so');
    else if (profile && router.canGoBack()) router.back();
    else router.replace('/');
  }

  function guard(action: () => Promise<void>, kind: NonNullable<typeof busy>) {
    if (!configured) {
      Alert.alert('Chưa nối máy chủ', 'App chưa được nối với Supabase. Xem hướng dẫn trong docs/supabase.md.');
      return;
    }
    setBusy(kind);
    action()
      .catch(showError)
      .finally(() => setBusy(null));
  }

  const sendCode = () =>
    guard(async () => {
      const trimmed = email.trim().toLowerCase();
      if (!emailPattern.test(trimmed)) throw new Error('Ba mẹ kiểm tra lại địa chỉ email nhé.');
      await sendEmailCode(trimmed);
      setEmail(trimmed);
      setCodeSent(true);
    }, 'email');

  const confirmCode = () =>
    guard(async () => {
      if (!isValidEmailCode(code)) throw new Error('Ba mẹ nhập đủ các chữ số trong email vừa nhận nhé.');
      await verifyEmailCode(email, code);
      await afterSignIn();
    }, 'code');

  const loginWithGoogle = () =>
    guard(async () => {
      if (await signInWithGoogle()) await afterSignIn();
    }, 'google');

  return (
    <Screen>
      <OnboardingHeader title="Ba Mẹ đăng nhập" onSkip={leave} />

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
              {APP_NAME} nhắn gửi:
            </AppText>
            <AppText variant="bodySm">“Con sẽ được hướng dẫn học từng bước nhẹ nhàng, vui vẻ và không áp lực!”</AppText>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.emailTitle}>
          <MaterialIcons name="mail-outline" size={22} color={Palette.blue} />
          <AppText variant="headlineSm">{codeSent ? 'Nhập mã trong email' : 'Đăng nhập bằng email'}</AppText>
        </View>
        {codeSent ? (
          <>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              Mã số đã được gửi tới {email}. Ba mẹ mở hộp thư (cả mục Spam) rồi nhập mã vào đây.
            </AppText>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(cleanEmailCode(text))}
              placeholder="••••••••"
              placeholderTextColor={Palette.inkSoft}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={EMAIL_CODE_MAX}
              style={[styles.input, styles.codeInput]}
            />
            <BigButton label="Xác nhận" icon="check" onPress={confirmCode} loading={busy === 'code'} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setCodeSent(false);
                setCode('');
              }}
              style={styles.linkButton}>
              <AppText variant="labelMd" color={Palette.blue}>
                Đổi email khác
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email.cua.ba.me@gmail.com"
              placeholderTextColor={Palette.inkSoft}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <BigButton label="Gửi mã đăng nhập" icon="send" onPress={sendCode} loading={busy === 'email'} />
          </>
        )}
      </Card>

      <View style={styles.buttons}>
        <LoginButton
          icon={
            busy === 'google' ? (
              <ActivityIndicator color={Palette.ink} />
            ) : (
              <FontAwesome name="google" size={22} color="#4285F4" />
            )
          }
          label="Tiếp tục với Google"
          tint={Palette.white}
          bordered
          onPress={loginWithGoogle}
        />
        <LoginButton
          icon={<FontAwesome name="apple" size={24} color={Palette.ink} />}
          label="Đăng nhập bằng Apple"
          tint={Palette.surfaceStrong}
          onPress={comingSoon}
        />
        <LoginButton
          icon={<MaterialIcons name="smartphone" size={24} color={Palette.ink} />}
          label="Đăng nhập bằng Số điện thoại"
          tint={Palette.surfaceMuted}
          onPress={comingSoon}
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
            Ảnh bài làm và kết quả chấm được cất trong kho riêng, chỉ tài khoản ba mẹ xem được.
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
  onPress,
}: {
  icon: ReactNode;
  label: string;
  tint: string;
  bordered?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
  emailTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 17,
    color: Palette.ink,
  },
  codeInput: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
  },
  linkButton: {
    alignSelf: 'center',
    padding: Spacing.two,
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
