import { Redirect } from 'expo-router';

// Trang "Tải app Android" chỉ có trên bản web (tai-app.web.tsx). Trong app điện thoại thì quay về trang chủ.
export default function DownloadAppRedirect() {
  return <Redirect href="/" />;
}
