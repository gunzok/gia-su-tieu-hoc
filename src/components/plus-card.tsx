import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { useParentalGate } from '@/components/parental-gate';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { plusPerks, purchaseErrorMessage, usePremium } from '@/lib/payments';
import { APP_NAME } from '@/lib/teacher';

function showError(error: unknown) {
  const message = purchaseErrorMessage(error);
  if (message) Alert.alert('Chưa xong', message);
}

// Thẻ gói Plus ở tab Tiến độ (dành cho ba mẹ): mời nâng cấp, hoặc quản lý gói đang dùng.
export function PlusCard() {
  const { storeReady, isPremium, showPaywall, showCustomerCenter, restore } = usePremium();
  const [busy, setBusy] = useState<'buy' | 'restore' | 'manage' | null>(null);
  const { gate, requireParent } = useParentalGate();

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<void>) {
    setBusy(kind);
    try {
      await action();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(null);
    }
  }

  if (isPremium) {
    return (
      <Card tint={Palette.amberSoft} borderColor={Palette.amber}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <MaterialIcons name="workspace-premium" size={26} color={Palette.amberInk} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelLg">Đang dùng {APP_NAME} Plus</AppText>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              Cảm ơn ba mẹ đã đồng hành cùng con!
            </AppText>
          </View>
        </View>
        {storeReady && (
          <BigButton
            label="Quản lý gói"
            icon="settings"
            variant="ghost"
            compact
            loading={busy === 'manage'}
            onPress={() => requireParent('quản lý gói Plus', () => run('manage', showCustomerCenter))}
          />
        )}
        {gate}
      </Card>
    );
  }

  return (
    <Card tint={Palette.amberSoft} borderColor={Palette.amber}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons name="workspace-premium" size={26} color={Palette.amberInk} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">Nâng cấp {APP_NAME} Plus</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Gói tháng, năm hoặc mua một lần dùng mãi
          </AppText>
        </View>
      </View>
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
      <BigButton
        label="Xem các gói"
        icon="star-outline"
        variant="amber"
        loading={busy === 'buy'}
        onPress={() => run('buy', async () => showPaywall())}
      />
      <Pressable
        accessibilityRole="button"
        disabled={busy !== null}
        onPress={() =>
          requireParent('khôi phục gói Plus đã mua', () =>
            run('restore', async () => {
              const restored = await restore();
              Alert.alert(
                restored ? 'Đã khôi phục gói Plus' : 'Chưa tìm thấy gói đã mua',
                restored
                  ? 'Các tính năng Plus đã mở lại.'
                  : 'Ba mẹ kiểm tra lại tài khoản App Store / Google Play đã dùng để mua nhé.',
              );
            }),
          )
        }
        style={styles.restore}>
        <AppText variant="labelMd" color={Palette.amberInk}>
          {busy === 'restore' ? 'Đang khôi phục…' : 'Khôi phục giao dịch đã mua'}
        </AppText>
      </Pressable>
      {gate}
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
  restore: {
    alignSelf: 'center',
    padding: Spacing.two,
    borderRadius: Radius.full,
  },
});
