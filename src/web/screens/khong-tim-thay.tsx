import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Palette, Spacing } from '@/constants/theme';
import { OnboardingFrame } from '@/web/onboarding-frame';

// Trang 404 của bản web (GIA-88): thay màn "Unmatched Route" tiếng Anh của Expo Router và trang `/_sitemap`.
// Web chạy kiểu SPA trên Cloudflare nên mọi đường dẫn sai vẫn trả mã 200; thêm `noindex` để máy tìm kiếm bỏ qua.
export default function NotFoundWeb() {
  return (
    <OnboardingFrame>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <View style={styles.wrap}>
        <Card style={styles.card}>
          <Mascot variant="full" size={140} />
          <AppText variant="headlineMd" accessibilityRole="header" style={styles.text}>
            Ôi, không tìm thấy trang này
          </AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.text}>
            Đường dẫn có thể đã cũ hoặc bị gõ nhầm. Mình quay về Trang chủ học tiếp nhé!
          </AppText>
          <BigButton label="Về Trang chủ" icon="home" onPress={() => router.replace('/')} />
        </Card>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    textAlign: 'center',
  },
});
