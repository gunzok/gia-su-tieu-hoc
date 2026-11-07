import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NoticeToast } from '@/components/notice-toast';
import { WebAlertHost } from '@/web/web-alert-host';
import { WebAuthReturn } from '@/web/auth-return';
import { ConsentGate } from '@/web/consent-gate';
import { Palette } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth';
import { HomeworkSessionProvider } from '@/lib/homework-session';
import { PremiumProvider } from '@/lib/payments';
import { ProfileProvider, useProfile } from '@/lib/profile';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.background, primary: Palette.blue },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  // Giữ màn hình chờ cho đến khi nạp xong font (lỗi font thì vẫn mở app bằng font máy).
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <PremiumProvider>
          <ProfileProvider>
            <RootNavigator />
          </ProfileProvider>
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Chưa có hồ sơ bé: chỉ vào được Khởi động / Hồ sơ / Đăng nhập (mở app sẽ vào Khởi động).
// Có hồ sơ rồi: vào thẳng các tab; sửa hồ sơ ở màn "sua-ho-so".
function RootNavigator() {
  const { ready, profile } = useProfile();
  if (!ready) return null;

  return (
    <HomeworkSessionProvider initialGrade={profile?.grade}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.background } }}>
        <Stack.Protected guard={!profile} redirectTo="/">
          <Stack.Screen name="khoi-dong" />
          <Stack.Screen name="ho-so" />
        </Stack.Protected>
        <Stack.Protected guard={!!profile} redirectTo="/khoi-dong">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sua-ho-so" />
          <Stack.Screen name="bai-cham/[id]" />
          <Stack.Screen name="hoi-co" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        {/* Đăng nhập mở được cả lúc mới cài app lẫn từ tab Tiến độ. */}
        <Stack.Screen name="dang-nhap" />
        <Stack.Screen name="chinh-sach-rieng-tu" />
        <Stack.Screen name="goi-plus" options={{ presentation: 'modal' }} />
      </Stack>
      <NoticeToast />
      <WebAlertHost />
      <WebAuthReturn />
      <ConsentGate />
    </HomeworkSessionProvider>
  );
}
