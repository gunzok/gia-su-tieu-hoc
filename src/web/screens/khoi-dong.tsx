import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';
import { OnboardingFrame } from '@/web/onboarding-frame';
import { useLayout } from '@/web/use-layout';

const features: { icon: IconName; title: string; hint: string; tint: string; border: string }[] = [
  { icon: 'bolt', title: 'Chấm bài tức thì', hint: 'Chuẩn xác & vui', tint: Palette.mintSoft, border: Palette.mint },
  { icon: 'headphones', title: 'Giọng giảng ấm', hint: 'Dịu dàng, kiên nhẫn', tint: Palette.amberSoft, border: Palette.amber },
  { icon: 'insights', title: 'Tiến độ cho ba mẹ', hint: 'Theo dõi mỗi ngày', tint: Palette.coralSoft, border: Palette.coral },
];

// Màn Khởi động bản web, theo Stitch "Web App v2 - Khởi động": máy tính (>= 1100px) chia 2 cột
// (hình cô giáo | lời chào), cửa sổ hẹp hơn xếp dọc. Hộp đồng ý của ba mẹ (web/consent-gate.tsx) vẫn hiện đè lên ở lần đầu.
export default function WebWelcomeScreen() {
  const { wide } = useLayout();
  const split = wide;
  const goLogin = () => router.push('/dang-nhap');

  return (
    <OnboardingFrame
      head={{
        title: `${APP_NAME}: gia sư AI chấm bài tập về nhà lớp 1–5`,
        description:
          'Bé chụp bài tập, gia sư AI chấm và nhận xét bằng tiếng Việt rồi đọc thành tiếng. Ba mẹ theo dõi tiến độ của con mỗi ngày.',
      }}
      action={split ? { label: 'Đăng nhập', onPress: goLogin } : undefined}>
      <View style={[styles.hero, split && styles.heroSplit]}>
        <Card style={[styles.heroCard, split && styles.heroCardSplit]} borderColor={Palette.mint}>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: Palette.mintSoft }]}>
              <MaterialIcons name="auto-awesome" size={16} color={Palette.blue} />
              <AppText variant="labelSm" color={Palette.blue}>
                GIA SƯ AI CHO BÉ
              </AppText>
            </View>
            <View style={[styles.tag, { backgroundColor: Palette.amberSoft }]}>
              <MaterialIcons name="verified-user" size={16} color={Palette.amberInk} />
              <AppText variant="labelSm" color={Palette.amberInk}>
                An toàn cho bé
              </AppText>
            </View>
          </View>
          <View style={styles.mascotWrap}>
            <Mascot variant="full" size={split ? 300 : 220} />
          </View>
          <View style={styles.ready}>
            <AppText variant="labelMd" color={Palette.blue}>
              🌸 Cô đã sẵn sàng đồng hành cùng con!
            </AppText>
          </View>
        </Card>

        <View style={[styles.copy, split && styles.copySplit]}>
          <View style={styles.titleBlock}>
            <AppText
              variant="headlineXl"
              color={Palette.blue}
              accessibilityRole="header"
              style={[split && styles.bigTitle, !split && styles.center]}>
              {APP_NAME} 🪄
            </AppText>
            <AppText variant="bodyLg" color={Palette.inkSoft} style={!split && styles.center}>
              Bạn đồng hành học tập thông minh & dịu dàng của con mỗi ngày.
            </AppText>
          </View>

          <View style={[styles.features, styles.featuresWrap]}>
            {features.map((feature) => (
              <View
                key={feature.title}
                style={[styles.feature, { backgroundColor: feature.tint, borderColor: feature.border }]}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={feature.icon} size={24} color={Palette.blue} />
                </View>
                <AppText variant="labelLg">{feature.title}</AppText>
                <AppText variant="bodySm" color={Palette.inkSoft}>
                  {feature.hint}
                </AppText>
              </View>
            ))}
          </View>

          <View style={split ? styles.ctaSplit : undefined}>
            <BigButton
              label="Bắt đầu khám phá ngay"
              variant="mint"
              icon="arrow-forward"
              iconAfter
              onPress={() => router.push('/ho-so')}
            />
          </View>

          <View style={[styles.bottomRow, !split && styles.bottomRowStacked]}>
            <View style={styles.loginRow}>
              <AppText variant="bodyMd" color={Palette.inkSoft}>
                Ba mẹ đã có tài khoản?
              </AppText>
              <Pressable accessibilityRole="button" onPress={goLogin} style={styles.link}>
                <AppText variant="labelLg" color={Palette.blue}>
                  Đăng nhập
                </AppText>
              </Pressable>
            </View>
            <View style={styles.safe}>
              <MaterialIcons name="shield" size={16} color={Palette.blue} />
              <AppText variant="labelMd">Bảo mật & không chứa quảng cáo</AppText>
            </View>
          </View>
        </View>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  hero: {
    gap: Spacing.four,
  },
  heroSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.five,
  },
  heroCard: {
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 2,
  },
  heroCardSplit: {
    flexGrow: 5,
    flexBasis: 0,
    padding: Spacing.five,
  },
  tags: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  mascotWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    // Ảnh cô giáo có nền trắng: để khung trắng cho liền.
    backgroundColor: Palette.white,
  },
  ready: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.mint,
  },
  copy: {
    gap: Spacing.four,
  },
  copySplit: {
    flexGrow: 7,
    flexBasis: 0,
  },
  titleBlock: {
    gap: Spacing.two,
  },
  bigTitle: {
    fontSize: 52,
    lineHeight: 62,
  },
  features: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  featuresWrap: {
    flexWrap: 'wrap',
  },
  feature: {
    flexGrow: 1,
    flexBasis: 160,
    gap: Spacing.one,
    padding: Spacing.three + 4,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  ctaSplit: {
    alignSelf: 'flex-start',
    minWidth: 340,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  bottomRowStacked: {
    flexDirection: 'column',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
  safe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
});
