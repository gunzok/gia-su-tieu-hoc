import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function ChoiceChips<T extends string | number>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              { backgroundColor: selected ? Accent.primary : theme.backgroundElement },
            ]}>
            <ThemedText style={[styles.label, selected && { color: Accent.onAccent }]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 48,
    minWidth: 56,
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 700,
  },
});
