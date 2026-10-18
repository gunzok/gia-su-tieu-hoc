import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';

type Props = {
  subtitle: string;
  right?: ReactNode;
};

// Thanh đầu trang: ảnh gia sư + tên app + dòng phụ, bên phải có thể gắn huy hiệu.
export function AppHeader({ subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <Mascot size={44} />
      <View style={styles.titles}>
        <AppText variant="headlineSm">{APP_NAME}</AppText>
        <AppText variant="bodySm" color={Palette.inkSoft}>
          {subtitle}
        </AppText>
      </View>
      {right}
    </View>
  );
}

export function HeaderPill({ icon, label, tint = Palette.amber }: { icon: string; label: string; tint?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: tint }]}>
      <AppText style={styles.pillIcon}>{icon}</AppText>
      <AppText variant="labelMd" color={Palette.amberInk}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
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
  },
  pillIcon: {
    fontSize: 15,
    lineHeight: 20,
  },
});
