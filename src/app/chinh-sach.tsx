import { Redirect } from 'expo-router';

// Trang riêng của bản web nằm ở chinh-sach.web.tsx. Trên app điện thoại dùng màn có sẵn.
export default function PrivacyRedirect() {
  return <Redirect href="/chinh-sach-rieng-tu" />;
}
