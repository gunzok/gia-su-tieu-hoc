import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  subtitle: string;
  right?: ReactNode;
};

// Thanh đầu trang: logo cú + "Gia Sư Nhí" + dòng phụ, bên phải có thể gắn huy hiệu.
export function AppHeader({ subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <AppText style={styles.logoEmoji}>🦉</AppText>
      </View>
      <View style={styles.titles}>
        <AppText variant="headlineSm" color={Palette.blueDark}>
          Gia Sư Nhí
        </AppText>
        <AppText variant="bodySm" color={Palette.inkSoft}>
          {subtitle}
        </AppText>
      </View>
      {right}
    </View>
  );
}

export function HeaderPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <AppText style={styles.pillIcon}>{icon}</AppText>
      <AppText variant="labelMd">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  titles: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderColor: Palette.border,
  },
  pillIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
});
