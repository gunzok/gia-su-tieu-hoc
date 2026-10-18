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
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Palette } from '@/constants/theme';
import { HomeworkSessionProvider } from '@/lib/homework-session';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.background, primary: Palette.blue },
};

export default function TabLayout() {
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
      <HomeworkSessionProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </HomeworkSessionProvider>
    </ThemeProvider>
  );
}
