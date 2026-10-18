/**
 * Màu, font và khoảng cách của app, lấy theo thiết kế "Cô Giáo Nhí (Flat Pastel)"
 * trong dự án Stitch "AI Gia Sư Tiểu Học": phẳng, màu pastel bạc hà / đào / vàng nhạt.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Tên giữ như cũ để các màn hình không phải đổi: "blue" là màu chính (xanh lá đậm),
// "mint" bạc hà, "coral" hồng đào, "amber" vàng nhạt.
export const Palette = {
  background: '#F9F9FF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F3FF',
  surfaceStrong: '#DEE8FF',
  border: '#E3E9F7',
  ink: '#111C2D',
  inkSoft: '#5B6573',

  blue: '#006B58',
  blueDark: '#005141',
  blueSoft: '#E7EEFF',

  amber: '#F9DE7F',
  amberDark: '#DFC569',
  amberSoft: '#FFF6D6',
  amberInk: '#554600',

  mint: '#7BD3BA',
  mintDark: '#006B58',
  mintSoft: '#D6F5EA',

  coral: '#FBB19F',
  coralDark: '#BA1A1A',
  coralSoft: '#FFE6DF',
  coralInk: '#784134',

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
  label: 'PlusJakartaSans_600SemiBold',
  body: 'NunitoSans_400Regular',
  bodyMedium: 'NunitoSans_600SemiBold',
  bodySemiBold: 'NunitoSans_700Bold',
} as const;

// Thang chữ của thiết kế (đã dùng bản mobile cho tiêu đề lớn).
export const Type = {
  headlineXl: { fontFamily: FontFamily.heading, fontSize: 30, lineHeight: 38 },
  headlineLg: { fontFamily: FontFamily.headingBold, fontSize: 26, lineHeight: 34 },
  headlineMd: { fontFamily: FontFamily.headingBold, fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: FontFamily.headingBold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: FontFamily.body, fontSize: 18, lineHeight: 28 },
  bodyMd: { fontFamily: FontFamily.body, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: FontFamily.headingBold, fontSize: 16, lineHeight: 22 },
  labelMd: { fontFamily: FontFamily.label, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: FontFamily.label, fontSize: 12, lineHeight: 16 },
} as const;

export type TypeVariant = keyof typeof Type;

export const Radius = {
  md: 16,
  lg: 28,
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
