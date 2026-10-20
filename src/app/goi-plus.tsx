import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

import { ParentalGate } from '@/components/parental-gate';
import { Screen } from '@/components/screen';
import { Palette } from '@/constants/theme';
import { hasPro, purchaseErrorMessage, usePremium } from '@/lib/payments';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Paywall của RevenueCat (thiết kế trên dashboard, offering "current": tháng / năm / trọn đời).
// Dùng thành phần nhúng thay vì presentPaywall để chạy được cả trong Expo Go (bản xem thử)
// lẫn bản build thật. Bé phải qua cổng phụ huynh trước khi thấy màn mua.
export default function PlusPaywallScreen() {
  const { updateCustomerInfo } = usePremium();
  const [parentChecked, setParentChecked] = useState(false);

  if (!parentChecked) {
    return (
      <Screen>
        <ParentalGate purpose="xem và mua gói Plus" onPass={() => setParentChecked(true)} onCancel={close} />
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        style={styles.container}
        options={{ displayCloseButton: true }}
        onPurchaseCompleted={({ customerInfo }) => {
          updateCustomerInfo(customerInfo);
          Alert.alert('Đã mở gói Plus 🎉', 'Cảm ơn ba mẹ! Các tính năng Plus đã sẵn sàng.');
          close();
        }}
        onRestoreCompleted={({ customerInfo }) => {
          updateCustomerInfo(customerInfo);
          Alert.alert(
            hasPro(customerInfo) ? 'Đã khôi phục gói Plus' : 'Chưa tìm thấy gói đã mua',
            hasPro(customerInfo)
              ? 'Các tính năng Plus đã mở lại.'
              : 'Ba mẹ kiểm tra lại tài khoản App Store / Google Play đã dùng để mua nhé.',
          );
          if (hasPro(customerInfo)) close();
        }}
        onPurchaseError={({ error }) => {
          const message = purchaseErrorMessage(error);
          if (message) Alert.alert('Chưa thanh toán được', message);
        }}
        onRestoreError={({ error }) => {
          const message = purchaseErrorMessage(error);
          if (message) Alert.alert('Chưa khôi phục được', message);
        }}
        onDismiss={close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
});
