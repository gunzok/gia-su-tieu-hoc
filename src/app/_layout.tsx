import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
} from '@expo-google-fonts/lexend';
import {
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
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
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
