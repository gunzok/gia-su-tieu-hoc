import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'amber' | 'mint' | 'coral' | 'ghost';
export type IconName = ComponentProps<typeof MaterialIcons>['name'];

const variantColors: Record<Variant, { face: string; text: string; border?: string }> = {
  primary: { face: Palette.blue, text: Palette.white },
  amber: { face: Palette.amber, text: Palette.amberInk },
  mint: { face: Palette.mint, text: Palette.blueDark },
  coral: { face: Palette.coral, text: Palette.coralInk },
  ghost: { face: Palette.surface, text: Palette.blue, border: Palette.mint },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

// Nút viên thuốc phẳng; bấm vào thì hơi thu nhỏ lại.
export function BigButton({ label, onPress, variant = 'primary', icon, disabled, loading, compact }: Props) {
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
              borderColor: colors.border ?? colors.face,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              {icon && <MaterialIcons name={icon} size={compact ? 20 : 24} color={colors.text} />}
              <AppText variant={compact ? 'labelMd' : 'labelLg'} color={colors.text} style={styles.label}>
                {label}
              </AppText>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  wrapperCompact: {
    alignSelf: 'auto',
  },
  face: {
    minHeight: 60,
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCompact: {
    minHeight: 46,
    paddingHorizontal: Spacing.three,
  },
  label: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
