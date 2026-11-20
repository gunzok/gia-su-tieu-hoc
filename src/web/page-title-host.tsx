import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { pageTitle } from '@/web/page-title';

// Đặt tiêu đề thẻ trình duyệt mỗi khi đổi màn (chỉ bản web; app điện thoại không làm gì).
export function WebPageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.title = pageTitle(pathname);
  }, [pathname]);

  return null;
}
