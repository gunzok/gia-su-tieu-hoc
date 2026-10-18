import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// Hàng nút chọn dạng viên thuốc, cuộn ngang được khi nhiều lựa chọn.
export function ChoiceChips<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
              selected
                ? { backgroundColor: Palette.mint, borderColor: Palette.mint }
                : { backgroundColor: Palette.surfaceMuted, borderColor: Palette.surfaceMuted },
            ]}>
            <AppText variant="labelLg" color={selected ? Palette.blueDark : Palette.ink}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  chip: {
    minHeight: 52,
    minWidth: 60,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
