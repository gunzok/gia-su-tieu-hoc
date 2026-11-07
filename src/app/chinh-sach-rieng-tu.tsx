import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Screen } from '@/components/screen';
import { Palette, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';

// Chính sách quyền riêng tư hiển thị ngay trong app (không mở trang web bên ngoài, vì app dành cho
// trẻ em). Sửa nội dung ở đây thì nhớ cập nhật bản đăng trên App Store / Google Play.
const updatedAt = '20/10/2026';

const sections: { title: string; body: string[] }[] = [
  {
    title: 'Chúng tôi thu thập gì',
    body: [
      'Hồ sơ của bé: tên thân mật (không bắt buộc), lớp, hình đại diện và gia sư bé chọn.',
      'Ảnh bài làm bé chụp và kết quả chấm (điểm, lời nhận xét).',
      'Câu bé hỏi cô (gõ chữ hoặc nói qua micro). App chỉ dùng micro khi bé bấm nút mic.',
      'Email của ba mẹ, nếu ba mẹ đăng nhập để lưu kết quả lên máy chủ.',
      'Thông tin gói Plus đã mua (do App Store / Google Play và RevenueCat xử lý; app không thấy số thẻ).',
    ],
  },
  {
    title: 'Dùng để làm gì',
    body: [
      'Chấm bài và đọc lời nhận xét cho bé nghe.',
      'Lưu lịch sử bài làm để ba mẹ xem lại tiến độ, kể cả trên máy khác.',
      'Giới hạn số lần chấm mỗi ngày và mở khoá tính năng gói Plus.',
      'App không có quảng cáo, không theo dõi bé để quảng cáo và không bán dữ liệu cho ai.',
    ],
  },
  {
    title: 'Chia sẻ với ai',
    body: [
      'Ảnh bài làm được gửi tới AI để chấm, chỉ cho việc chấm bài đó: Gemini (Google) hoặc Claude (công ty Anthropic).',
      'Trong giai đoạn thử nghiệm, app dùng gói miễn phí của Gemini: theo điều khoản của Google, nội dung gửi lên có thể được Google dùng để cải thiện sản phẩm. Khi mở cho nhiều gia đình dùng, app sẽ chuyển sang gói trả phí không dùng dữ liệu như vậy.',
      'Khi bé bấm "Hỏi cô", câu bé hỏi và nội dung câu đó trong bài được gửi tới AI (Gemini hoặc Claude) để trả lời.',
      'Nếu bố mẹ cài AI trên máy tính ở nhà (LM Studio) và máy chủ không chấm được, ảnh bài làm và câu hỏi được gửi tới máy tính đó qua mạng Wi-Fi nhà, không đi ra Internet.',
      'Lời nhận xét (chỉ phần chữ, không có ảnh) được gửi tới Google Cloud để đọc bằng giọng cô/thầy.',
      'Khi bé bấm nút mic ở "Hỏi cô", giọng bé được nhận thành chữ bằng tính năng nhận giọng có sẵn của điện thoại, do Apple (iPhone) hoặc Google (Android) xử lý. App không lưu bản ghi âm; chỉ phần chữ bé xem lại và bấm gửi mới được gửi tới AI.',
      'Dữ liệu được lưu trên máy chủ Supabase, trong kho riêng: chỉ tài khoản của ba mẹ xem được.',
      'RevenueCat nhận mã tài khoản (không có tên bé) để xác nhận gói Plus.',
    ],
  },
  {
    title: 'Lưu bao lâu và cách xoá',
    body: [
      'Dữ liệu được giữ cho đến khi ba mẹ xoá.',
      'Ba mẹ có thể xoá lịch sử chấm bài ở tab Tiến độ, hoặc bấm "Xoá tài khoản & dữ liệu" để xoá vĩnh viễn hồ sơ bé, bài chấm, ảnh và tài khoản trên máy chủ.',
      'Gói Plus không tự huỷ khi xoá tài khoản: ba mẹ huỷ trong App Store / Google Play.',
    ],
  },
  {
    title: 'Liên hệ',
    body: ['Ba mẹ có câu hỏi về quyền riêng tư, vui lòng liên hệ qua email hỗ trợ ghi trên trang của app trong App Store / Google Play.'],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <Screen>
      <OnboardingHeader title="Chính sách quyền riêng tư" />
      <AppText variant="bodyMd" color={Palette.inkSoft}>
        {APP_NAME} giúp bé làm bài tập về nhà. Chúng tôi chỉ dùng dữ liệu của bé để chấm bài và giúp ba mẹ
        theo dõi việc học. Cập nhật ngày {updatedAt}.
      </AppText>
      {sections.map((section) => (
        <Card key={section.title}>
          <AppText variant="headlineSm">{section.title}</AppText>
          <View style={styles.list}>
            {section.body.map((line) => (
              <View key={line} style={styles.item}>
                <AppText variant="bodyMd" color={Palette.blue}>
                  •
                </AppText>
                <AppText variant="bodyMd" style={styles.flex}>
                  {line}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
