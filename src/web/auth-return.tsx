import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth, WEB_OAUTH_PENDING_KEY } from '@/lib/auth';
import { useProfile } from '@/lib/profile';

// Bản web: Google đưa ba mẹ quay lại /dang-nhap kèm phiên đăng nhập (Supabase đọc từ địa chỉ).
// Làm nốt bước sau đăng nhập giống app: lấy hồ sơ bé trên máy chủ, có thì vào app, chưa có thì tạo hồ sơ (GIA-64).
export function WebAuthReturn() {
  const { signedIn } = useAuth();
  const { syncAfterSignIn } = useProfile();
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web' || !signedIn || pathname !== '/dang-nhap') return;
    if (window.sessionStorage.getItem(WEB_OAUTH_PENDING_KEY) !== '1') return;
    window.sessionStorage.removeItem(WEB_OAUTH_PENDING_KEY);
    syncAfterSignIn().then((synced) => router.replace(synced ? '/' : '/ho-so'));
    // syncAfterSignIn đổi mỗi lần vẽ lại; chỉ chạy khi vừa đăng nhập xong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, pathname]);

  return null;
}
