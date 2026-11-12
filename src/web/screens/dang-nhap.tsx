import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { EMAIL_CODE_MAX } from '@/lib/email-code';
import { APP_NAME } from '@/lib/teacher';
import { comingSoon, useParentLogin } from '@/lib/use-parent-login';
import { Columns } from '@/web/columns';
import { OnboardingFrame } from '@/web/onboarding-frame';

// Màn "Ba Mẹ đăng nhập" bản web, theo Stitch "Web App v2 - Đăng nhập Ba Mẹ":
// cột trái lời chào + lời nhắn + an toàn, cột phải thẻ đăng nhập. Cửa sổ hẹp: thẻ đăng nhập lên trước.
export default function WebParentLoginScreen() {
  const login = useParentLogin();

  const welcome = (
    <Card style={styles.welcome}>
      <View style={styles.avatarWrap}>
        <Mascot size={112} background={Palette.mintSoft} />
        <View style={styles.sparkle}>
          <MaterialIcons name="auto-awesome" size={18} color={Palette.amberInk} />
        </View>
      </View>
      <View style={styles.portalTag}>
        <MaterialIcons name="family-restroom" size={16} color={Palette.blue} />
        <AppText variant="labelSm" color={Palette.blue}>
          CỔNG THÔNG TIN PHỤ HUYNH
        </AppText>
      </View>
      <AppText variant="headlineXl" accessibilityRole="header">
        Chào mừng Ba Mẹ! 👋
      </AppText>
      <AppText variant="bodyLg" color={Palette.inkSoft}>
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
          <AppText variant="bodyMd">“Con sẽ được hướng dẫn học từng bước nhẹ nhàng, vui vẻ và không áp lực!”</AppText>
        </View>
      </View>
      <View style={styles.safety}>
        <View style={styles.safetyIcon}>
          <MaterialIcons name="verified-user" size={22} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">An toàn & bảo mật cho trẻ em</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Ảnh bài làm và kết quả chấm được cất trong kho riêng, chỉ tài khoản ba mẹ xem được.
          </AppText>
        </View>
      </View>
    </Card>
  );

  const form = (
    <Card style={styles.form}>
      <View style={styles.formTitle}>
        <View style={styles.formIcon}>
          <MaterialIcons name="mail-outline" size={22} color={Palette.blue} />
        </View>
        <AppText variant="headlineMd">{login.codeSent ? 'Nhập mã trong email' : 'Đăng nhập bằng email'}</AppText>
      </View>

      {login.codeSent ? (
        <>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Mã số đã được gửi tới {login.email}. Ba mẹ mở hộp thư (cả mục Spam) rồi nhập mã vào đây.
          </AppText>
          <TextInput
            value={login.code}
            onChangeText={login.setCode}
            onSubmitEditing={login.confirmCode}
            placeholder="••••••••"
            placeholderTextColor={Palette.inkSoft}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={EMAIL_CODE_MAX}
            accessibilityLabel="Mã đăng nhập trong email"
            style={[styles.input, styles.codeInput]}
          />
          <BigButton label="Xác nhận" icon="check" onPress={login.confirmCode} loading={login.busy === 'code'} />
          <Pressable accessibilityRole="button" onPress={login.changeEmail} style={styles.textButton}>
            <AppText variant="labelMd" color={Palette.blue}>
              Đổi email khác
            </AppText>
          </Pressable>
        </>
      ) : (
        <>
          <AppText variant="labelMd">Địa chỉ email</AppText>
          <TextInput
            value={login.email}
            onChangeText={login.setEmail}
            onSubmitEditing={login.sendCode}
            placeholder="email.cua.ba.me@gmail.com"
            placeholderTextColor={Palette.inkSoft}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Địa chỉ email của ba mẹ"
            style={styles.input}
          />
          <BigButton
            label="Gửi mã đăng nhập"
            variant="mint"
            icon="send"
            iconAfter
            onPress={login.sendCode}
            loading={login.busy === 'email'}
          />
          <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
            Mã số đăng nhập sẽ được gửi vào email của ba mẹ.
          </AppText>
        </>
      )}

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <AppText variant="bodySm" color={Palette.inkSoft}>
          hoặc
        </AppText>
        <View style={styles.divider} />
      </View>

      <OptionButton
        icon={
          login.busy === 'google' ? (
            <ActivityIndicator color={Palette.ink} />
          ) : (
            <FontAwesome name="google" size={20} color="#4285F4" />
          )
        }
        label="Tiếp tục với Google"
        onPress={login.loginWithGoogle}
        strong
      />
      <View style={styles.soonRow}>
        <OptionButton
          icon={<FontAwesome name="apple" size={20} color={Palette.inkSoft} />}
          label="Đăng nhập bằng Apple"
          onPress={comingSoon}
          soon
          inRow
        />
        <OptionButton
          icon={<MaterialIcons name="smartphone" size={20} color={Palette.inkSoft} />}
          label="Đăng nhập bằng Số điện thoại"
          onPress={comingSoon}
          soon
          inRow
        />
      </View>
      <OptionButton
        icon={<MaterialIcons name="school" size={20} color={Palette.amberInk} />}
        label="Tài khoản Trường học / Lớp học"
        hint="Dùng mã liên kết do nhà trường cung cấp"
        onPress={comingSoon}
        soon
      />
    </Card>
  );

  return (
    <OnboardingFrame back onSkip={login.leave}>
      {/* Máy tính: lời chào 5 phần, thẻ đăng nhập 7 phần. Cửa sổ hẹp hơn: xếp dọc như app điện thoại. */}
      <Columns main={welcome} aside={form} ratio={5 / 7} />
    </OnboardingFrame>
  );
}

function OptionButton({
  icon,
  label,
  hint,
  onPress,
  strong,
  soon,
  inRow,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  strong?: boolean;
  soon?: boolean;
  inRow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={soon ? `${label}, sắp có` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        inRow && styles.rowItem,
        strong && styles.optionStrong,
        soon && styles.optionSoon,
        pressed && styles.pressed,
      ]}>
      {icon}
      <View style={styles.flexShrink}>
        <AppText variant={strong ? 'labelLg' : 'labelMd'} color={soon ? Palette.inkSoft : Palette.ink}>
          {label}
        </AppText>
        {hint && (
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {hint}
          </AppText>
        )}
      </View>
      {soon && (
        <View style={styles.soonTag}>
          <AppText variant="labelSm" color={Palette.amberInk}>
            Sắp có
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  welcome: {
    gap: Spacing.three,
    padding: Spacing.five,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    backgroundColor: Palette.mintSoft,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.surfaceStrong,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safety: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.three,
    padding: Spacing.five,
  },
  formTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  formIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 56,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.body,
    fontSize: 17,
    color: Palette.ink,
  },
  codeInput: {
    fontSize: 26,
    letterSpacing: 8,
    textAlign: 'center',
  },
  textButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  soonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  // Chỉ nút nằm trong hàng ngang mới co giãn theo bề ngang (trong cột, flexBasis sẽ thành chiều cao).
  rowItem: {
    flexGrow: 1,
    flexBasis: 220,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  optionStrong: {
    minHeight: 56,
    borderWidth: 2,
  },
  optionSoon: {
    backgroundColor: Palette.surfaceMuted,
    justifyContent: 'flex-start',
  },
  soonTag: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    backgroundColor: Palette.amberSoft,
  },
});
