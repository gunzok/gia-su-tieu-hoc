import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/web/screen';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Trình duyệt không mua được qua RevenueCat: chỉ hướng dẫn mua trong app trên điện thoại.
export default function PlusPaywallWeb() {
  return (
    <Screen>
      <Card style={styles.card}>
        <Mascot variant="full" size={140} />
        <AppText variant="headlineMd" style={styles.text}>
          Gói Plus mua trong app trên điện thoại
        </AppText>
        <AppText variant="bodyMd" color="#5B6573" style={styles.text}>
          Ba mẹ mở app Gia sư Tiểu học trên iPhone hoặc Android, vào tab Tiến độ rồi chọn “Xem các gói” nhé.
        </AppText>
        <BigButton label="Quay lại" icon="arrow-back" onPress={close} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
