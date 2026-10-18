import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type Props = ViewProps & {
  /** Màu nền thẻ, mặc định trắng. */
  tint?: string;
  /** Màu viền, mặc định viền xanh nhạt. */
  borderColor?: string;
};

// Thẻ phẳng bo tròn lớn, viền mảnh và bóng rất nhẹ (phong cách Flat Pastel).
export function Card({ tint = Palette.surface, borderColor = Palette.border, style, ...rest }: Props) {
  return <View style={[styles.card, { backgroundColor: tint, borderColor }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three + 4,
    gap: Spacing.three,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
