import { StyleSheet, View, type ViewProps } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

type Props = ViewProps & {
  /** Màu nền thẻ, mặc định trắng. */
  tint?: string;
  /** Màu viền, mặc định viền kem. */
  borderColor?: string;
};

// Thẻ trắng bo tròn, viền kem và "gờ" dưới dày như khối đồ chơi.
export function Card({ tint = Palette.surface, borderColor = Palette.border, style, ...rest }: Props) {
  return <View style={[styles.card, { backgroundColor: tint, borderColor }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderBottomWidth: 5,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
