/**
 * Màu, font và khoảng cách của app, lấy theo thiết kế "AI Gia Sư Tiểu Học" trên Stitch.
 * App chỉ có giao diện sáng (nền kem ấm) cho dễ nhìn với trẻ nhỏ.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Bảng màu chính của thiết kế. Mỗi màu có bản đậm (viền dưới nút 3D) và bản nhạt (nền thẻ).
export const Palette = {
  background: '#FFFDF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EFE6',
  border: '#ECE6D9',
  ink: '#1E293B',
  inkSoft: '#64748B',

  blue: '#3B82F6',
  blueDark: '#1D4ED8',
  blueSoft: '#E0ECFF',

  amber: '#FFB800',
  amberDark: '#D99A00',
  amberSoft: '#FFF4D6',
  amberInk: '#6B4B00',

  mint: '#10B981',
  mintDark: '#047857',
  mintSoft: '#D7F7EA',

  coral: '#FF6B6B',
  coralDark: '#E04848',
  coralSoft: '#FFE6E6',

  white: '#FFFFFF',
} as const;

// Giữ lại cho các component mẫu của Expo còn dùng ThemedText/ThemedView.
const lightColors = {
  text: Palette.ink,
  background: Palette.background,
  backgroundElement: Palette.surfaceMuted,
  backgroundSelected: Palette.border,
  textSecondary: Palette.inkSoft,
};

export const Colors = {
  light: lightColors,
  dark: lightColors,
} as const;

// Màu nhấn theo ý nghĩa: đúng / sai / chính.
export const Accent = {
  primary: Palette.blue,
  primarySoft: Palette.blueSoft,
  correct: Palette.mint,
  wrong: Palette.coralDark,
  onAccent: Palette.white,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Tên font khớp với tên được nạp bằng useFonts trong src/app/_layout.tsx.
export const FontFamily = {
  heading: 'PlusJakartaSans_800ExtraBold',
  headingBold: 'PlusJakartaSans_700Bold',
  body: 'Lexend_400Regular',
  bodyMedium: 'Lexend_500Medium',
  bodySemiBold: 'Lexend_600SemiBold',
} as const;

// Thang chữ của thiết kế (đã dùng bản mobile cho tiêu đề lớn).
export const Type = {
  headlineXl: { fontFamily: FontFamily.heading, fontSize: 30, lineHeight: 38 },
  headlineLg: { fontFamily: FontFamily.heading, fontSize: 24, lineHeight: 32 },
  headlineMd: { fontFamily: FontFamily.headingBold, fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: FontFamily.headingBold, fontSize: 19, lineHeight: 26 },
  bodyLg: { fontFamily: FontFamily.bodyMedium, fontSize: 18, lineHeight: 28 },
  bodyMd: { fontFamily: FontFamily.body, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: FontFamily.headingBold, fontSize: 17, lineHeight: 22 },
  labelMd: { fontFamily: FontFamily.headingBold, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: FontFamily.headingBold, fontSize: 12, lineHeight: 16 },
} as const;

export type TypeVariant = keyof typeof Type;

export const Radius = {
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 84 }) ?? 0;
export const MaxContentWidth = 600;
