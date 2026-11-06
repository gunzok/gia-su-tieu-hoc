import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { plusPerks, useIsPremium } from '@/lib/payments';
import { APP_NAME } from '@/lib/teacher';

// Thẻ gói Plus của bản web. RevenueCat chỉ bán được trong app trên điện thoại (App Store / Google Play),
// nên trên web chỉ giới thiệu gói và hướng dẫn mua trong app.
export function WebPlusCard() {
  const isPremium = useIsPremium();

  return (
    <Card tint={Palette.amberSoft} borderColor={Palette.amber}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons name="workspace-premium" size={26} color={Palette.amberInk} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">{isPremium ? `Đang dùng ${APP_NAME} Plus` : `Nâng cấp ${APP_NAME} Plus`}</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {isPremium ? 'Cảm ơn ba mẹ đã đồng hành cùng con!' : 'Gói tháng, năm hoặc mua một lần dùng mãi'}
          </AppText>
        </View>
      </View>
      {!isPremium && (
        <View style={styles.perks}>
          {plusPerks.map((perk) => (
            <View key={perk} style={styles.perk}>
              <MaterialIcons name="check-circle-outline" size={18} color={Palette.blue} />
              <AppText variant="bodyMd" style={styles.flex}>
                {perk}
              </AppText>
            </View>
          ))}
        </View>
      )}
      <View style={styles.note}>
        <MaterialIcons name="smartphone" size={20} color={Palette.amberInk} />
        <AppText variant="bodySm" style={styles.flex}>
          {isPremium
            ? 'Ba mẹ quản lý gói Plus trong app trên điện thoại (tab Tiến độ).'
            : 'Gói Plus được mua trong app trên điện thoại (App Store hoặc Google Play). Ba mẹ mở app, vào tab Tiến độ để nâng cấp nhé.'}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perks: {
    gap: Spacing.two,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
});
