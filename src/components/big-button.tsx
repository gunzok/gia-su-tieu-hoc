import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'amber' | 'mint' | 'ghost';

const variantColors: Record<Variant, { face: string; edge: string; text: string }> = {
  primary: { face: Palette.blue, edge: Palette.blueDark, text: Palette.white },
  amber: { face: Palette.amber, edge: Palette.amberDark, text: Palette.amberInk },
  mint: { face: Palette.mint, edge: Palette.mintDark, text: Palette.white },
  ghost: { face: Palette.surface, edge: Palette.blue, text: Palette.blueDark },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

// Nút viên thuốc kiểu đồ chơi: có gờ dưới đậm màu, bấm vào thì lún xuống 3px.
export function BigButton({ label, onPress, variant = 'primary', disabled, loading, compact }: Props) {
  const colors = variantColors[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      style={[styles.wrapper, compact && styles.wrapperCompact, inactive && styles.disabled]}>
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            compact && styles.faceCompact,
            {
              backgroundColor: colors.face,
              borderColor: colors.edge,
              borderWidth: variant === 'ghost' ? 2 : 0,
              borderBottomWidth: pressed ? 1 : 5,
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <AppText variant={compact ? 'labelMd' : 'labelLg'} color={colors.text} style={styles.label}>
              {label}
            </AppText>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    paddingBottom: 3,
  },
  wrapperCompact: {
    alignSelf: 'auto',
  },
  face: {
    minHeight: 60,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCompact: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  label: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
