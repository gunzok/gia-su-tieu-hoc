import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

export function BigButton({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? Accent.primary : theme.backgroundElement },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? Accent.onAccent : theme.text} />
      ) : (
        <ThemedText style={[styles.label, primary && { color: Accent.onAccent }]}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 20,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
