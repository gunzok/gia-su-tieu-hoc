import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { Columns } from '@/web/columns';
import { LegalLinks } from '@/web/legal-links';
import { Screen } from '@/web/screen';
import { APK_LATEST_URL, RELEASES_URL } from '@/web/screens/tai-app-links';
import { useLayout } from '@/web/use-layout';


type Step = { icon: IconName; title: string; body: string };

// Tên nút trên máy có thể hơi khác tuỳ hãng điện thoại; giữ lời ngắn, nói đúng việc cần bấm.
const installSteps: Step[] = [
  {
    icon: 'smartphone',
    title: 'Mở trang này trên điện thoại Android',
    body: 'Dùng trình duyệt Chrome trên chính chiếc điện thoại bé sẽ học, rồi bấm nút “Tải app”.',
  },
  {
    icon: 'file-download',
    title: 'Cho phép tải file',
    body: 'Chrome có thể hỏi “File này có thể gây hại”. Ba mẹ bấm “Vẫn tải xuống”.',
  },
  {
    icon: 'folder-open',
    title: 'Mở file vừa tải',
    body: 'Bấm “Mở” ở thông báo tải xong, hoặc vào ứng dụng Tệp (Files) → Tải xuống → GiaSuTieuHoc.apk.',
  },
  {
    icon: 'verified-user',
    title: 'Cho phép cài từ Chrome (chỉ lần đầu)',
    body: 'Máy báo chưa cho cài ứng dụng không rõ nguồn: bấm “Cài đặt”, bật “Cho phép từ nguồn này”, rồi bấm quay lại.',
  },
  {
    icon: 'install-mobile',
    title: 'Bấm “Cài đặt”',
    body: 'Nếu Google Play Protect hỏi, chọn “Thông tin chi tiết” → “Vẫn cài đặt”. Chờ vài giây là xong.',
  },
  {
    icon: 'celebration',
    title: 'Mở app Gia sư Tiểu học',
    body: 'Biểu tượng mới nằm ở màn hình chính. Mở app và tạo hồ sơ cho bé là bắt đầu chấm bài được.',
  },
];

function openUrl(url: string) {
  Linking.openURL(url).catch(() => undefined);
}

export default function DownloadAppScreen() {
  const { narrow } = useLayout();

  const downloadCard = (
    <Card tint={Palette.mintSoft} borderColor={Palette.mintSoft}>
      <View style={[styles.downloadHead, narrow && styles.downloadHeadNarrow]}>
        <View style={styles.androidIcon}>
          <MaterialIcons name="android" size={40} color={Palette.white} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineMd" color={Palette.blueDark}>
            App cho điện thoại Android
          </AppText>
          <AppText variant="bodyMd" color={Palette.blueDark}>
            Bản mới nhất, cài trực tiếp bằng file APK. Miễn phí, không cần tài khoản Google Play.
          </AppText>
        </View>
      </View>
      <BigButton label="Tải app (file APK)" icon="file-download" onPress={() => openUrl(APK_LATEST_URL)} />
      <AppText variant="bodySm" color={Palette.blueDark}>
        iPhone, iPad chưa có bản cài. Ba mẹ dùng bản web này trên trình duyệt nhé.
      </AppText>
    </Card>
  );

  const stepsCard = (
    <Card>
      <AppText variant="headlineSm" accessibilityRole="header">
        Cách cài, từng bước
      </AppText>
      <View style={styles.steps}>
        {installSteps.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepNumber}>
              <AppText variant="labelLg" color={Palette.white}>
                {index + 1}
              </AppText>
            </View>
            <View style={styles.flex}>
              <View style={styles.stepTitle}>
                <MaterialIcons name={step.icon} size={22} color={Palette.blue} />
                <AppText variant="labelLg" style={styles.flex}>
                  {step.title}
                </AppText>
              </View>
              <AppText variant="bodyMd" color={Palette.inkSoft}>
                {step.body}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const updateCard = (
    <Card tint={Palette.amberSoft} borderColor={Palette.amberSoft}>
      <View style={styles.cardTitle}>
        <MaterialIcons name="system-update" size={24} color={Palette.amberInk} />
        <AppText variant="headlineSm" color={Palette.amberInk} accessibilityRole="header">
          Cập nhật app
        </AppText>
      </View>
      <AppText variant="bodyMd" color={Palette.amberInk}>
        Sửa nhỏ: app tự cập nhật. Ba mẹ tắt hẳn app rồi mở lại 1-2 lần là có bản mới.
      </AppText>
      <AppText variant="bodyMd" color={Palette.amberInk}>
        Bản lớn: quay lại trang này, tải file mới và cài đè lên app cũ. Bài đã chấm và hồ sơ của bé vẫn giữ nguyên.
      </AppText>
    </Card>
  );

  const safetyCard = (
    <Card>
      <View style={styles.cardTitle}>
        <MaterialIcons name="lock" size={24} color={Palette.blue} />
        <AppText variant="headlineSm" accessibilityRole="header">
          An toàn cho máy
        </AppText>
      </View>
      <AppText variant="bodyMd" color={Palette.inkSoft}>
        Chỉ tải app từ nút trên trang này. File nằm ở trang phát hành chính thức của Gia sư Tiểu học trên GitHub.
      </AppText>
      <AppText variant="bodyMd" color={Palette.inkSoft}>
        Cài xong, ba mẹ có thể tắt lại quyền “Cho phép từ nguồn này” của Chrome trong Cài đặt.
      </AppText>
      <Pressable accessibilityRole="link" onPress={() => openUrl(RELEASES_URL)} style={styles.textLink}>
        <AppText variant="labelMd" color={Palette.blue}>
          Xem trang phát hành và những gì mới
        </AppText>
        <MaterialIcons name="open-in-new" size={18} color={Palette.blue} />
      </Pressable>
    </Card>
  );

  return (
    <Screen>
      <View style={styles.page}>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/')} style={styles.back}>
          <MaterialIcons name="arrow-back" size={20} color={Palette.blue} />
          <AppText variant="labelMd" color={Palette.blue}>
            Về trang chủ
          </AppText>
        </Pressable>
        <AppText variant="headlineLg" accessibilityRole="header">
          Tải app Gia sư Tiểu học
        </AppText>
        <AppText variant="bodyLg" color={Palette.inkSoft}>
          Bé chụp bài bằng điện thoại, cô chấm và đọc lời khen ngay trên máy.
        </AppText>
        <Columns
          ratio={1.3}
          from="medium"
          main={
            <>
              {downloadCard}
              {stepsCard}
            </>
          }
          aside={
            <>
              {updateCard}
              {safetyCard}
            </>
          }
        />
        <LegalLinks />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  flex: { flex: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  downloadHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  downloadHeadNarrow: {
    alignItems: 'flex-start',
  },
  androidIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { gap: Spacing.three },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.half,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
});
