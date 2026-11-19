import { APP_NAME } from '@/lib/teacher';

// Tiêu đề thẻ trình duyệt theo từng màn (GIA-89, WCAG 2.4.2). Đặt theo đường dẫn ở một chỗ để màn nào
// (kể cả màn dùng chung với app như Sửa hồ sơ, Bài đã chấm, trang 404) cũng có tiêu đề riêng và rời màn
// thì không còn giữ tiêu đề cũ.

/** Màn Khởi động là trang giới thiệu khi chia sẻ link, nên tiêu đề nói rõ app làm gì. */
export const LANDING_TITLE = `${APP_NAME}: gia sư AI chấm bài tập về nhà lớp 1–5`;

const titles: Record<string, string> = {
  '/': 'Trang chủ',
  '/quet-bai': 'Quét bài',
  '/chua-bai': 'Chữa bài',
  '/tien-do': 'Tiến độ',
  '/hoi-co': 'Hỏi cô',
  '/dang-nhap': 'Ba Mẹ đăng nhập',
  '/ho-so': 'Hồ sơ của bé',
  '/sua-ho-so': 'Sửa hồ sơ của bé',
  '/chinh-sach': 'Chính sách quyền riêng tư',
  '/chinh-sach-rieng-tu': 'Chính sách quyền riêng tư',
  '/dieu-khoan': 'Điều khoản sử dụng',
  '/tai-app': 'Tải app Android',
  '/goi-plus': 'Gói Plus',
};

export const NOT_FOUND_TITLE = 'Không tìm thấy trang';

export function pageTitle(pathname: string) {
  // Bỏ dấu "/" thừa ở cuối và chữ hoa/thường khác nhau giữa các trình duyệt không quan trọng ở đây.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/khoi-dong') return LANDING_TITLE;
  const name = titles[path] ?? (path.startsWith('/bai-cham/') ? 'Bài đã chấm' : NOT_FOUND_TITLE);
  return `${name} · ${APP_NAME}`;
}
