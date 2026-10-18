import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';

const features: { icon: IconName; title: string; hint: string; tint: string }[] = [
  { icon: 'bolt', title: 'Chấm bài tức thì', hint: 'Chuẩn xác & vui', tint: Palette.mintSoft },
  { icon: 'headphones', title: 'Giọng giảng ấm', hint: 'Dịu dàng, kiên nhẫn', tint: Palette.amberSoft },
  { icon: 'insights', title: 'Tiến độ cho ba mẹ', hint: 'Theo dõi mỗi ngày', tint: Palette.coralSoft },
];

// Màn chào khi mở app lần đầu (thiết kế Stitch "Khởi động").
export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: Palette.surfaceStrong }]}>
          <MaterialIcons name="auto-awesome" size={16} color={Palette.blue} />
          <AppText variant="labelSm">GIA SƯ AI CHO BÉ</AppText>
        </View>
        <View style={[styles.tag, { backgroundColor: Palette.amberSoft }]}>
          <MaterialIcons name="verified-user" size={16} color={Palette.amberInk} />
          <AppText variant="labelSm" color={Palette.amberInk}>
            An toàn cho bé
          </AppText>
        </View>
      </View>

      <View style={styles.heroRing}>
        <View style={styles.heroCircle}>
          <Mascot variant="full" size={230} />
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="headlineXl" color={Palette.blue} style={styles.center}>
          {APP_NAME} 🪄
        </AppText>
        <AppText variant="bodyLg" color={Palette.inkSoft} style={styles.center}>
          Bạn đồng hành học tập thông minh & dịu dàng của con mỗi ngày.
        </AppText>
      </View>

      <View style={styles.features}>
        {features.map((feature) => (
          <View key={feature.title} style={[styles.feature, { backgroundColor: feature.tint }]}>
            <View style={styles.featureIcon}>
              <MaterialIcons name={feature.icon} size={24} color={Palette.blue} />
            </View>
            <AppText variant="labelMd" style={styles.center}>
              {feature.title}
            </AppText>
            <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
              {feature.hint}
            </AppText>
          </View>
        ))}
      </View>

      <BigButton label="Bắt đầu khám phá ngay" variant="mint" icon="arrow-forward" iconAfter onPress={() => router.push('/ho-so')} />

      <View style={styles.loginRow}>
        <AppText variant="bodyMd" color={Palette.inkSoft}>
          Ba mẹ đã có tài khoản?
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.push('/dang-nhap')}>
          <AppText variant="labelLg" color={Palette.blue}>
            Đăng nhập
          </AppText>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <MaterialIcons name="shield" size={14} color={Palette.inkSoft} />
        <AppText variant="bodySm" color={Palette.inkSoft}>
          Bảo mật & không chứa quảng cáo
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  heroRing: {
    alignSelf: 'center',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 10,
    borderColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: 262,
    height: 262,
    borderRadius: 131,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleBlock: {
    gap: Spacing.two,
  },
  features: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three + 4,
    paddingHorizontal: Spacing.two,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
