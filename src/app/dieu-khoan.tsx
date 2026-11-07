import { Redirect } from 'expo-router';

// Điều khoản sử dụng hiện chỉ có trên bản web (dieu-khoan.web.tsx). Trên app điện thoại quay về trang chủ.
export default function TermsRedirect() {
  return <Redirect href="/" />;
}
