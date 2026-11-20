// GIA-89: mỗi màn web một tiêu đề thẻ trình duyệt riêng.
import { LANDING_TITLE, pageTitle } from '@/web/page-title';

describe('tiêu đề thẻ trình duyệt theo màn', () => {
  it.each([
    ['/', 'Trang chủ · Gia sư Tiểu học'],
    ['/quet-bai', 'Quét bài · Gia sư Tiểu học'],
    ['/chua-bai', 'Chữa bài · Gia sư Tiểu học'],
    ['/tien-do', 'Tiến độ · Gia sư Tiểu học'],
    ['/hoi-co', 'Hỏi cô · Gia sư Tiểu học'],
    ['/chinh-sach', 'Chính sách quyền riêng tư · Gia sư Tiểu học'],
    ['/dieu-khoan', 'Điều khoản sử dụng · Gia sư Tiểu học'],
    ['/tai-app', 'Tải app Android · Gia sư Tiểu học'],
    ['/ho-so', 'Hồ sơ của bé · Gia sư Tiểu học'],
    ['/bai-cham/abc-123', 'Bài đã chấm · Gia sư Tiểu học'],
    ['/quet-bai/', 'Quét bài · Gia sư Tiểu học'],
  ])('%s → %s', (path, title) => {
    expect(pageTitle(path)).toBe(title);
  });

  it('Trang chủ không còn giữ tiêu đề "Hồ sơ của bé"', () => {
    expect(pageTitle('/')).not.toContain('Hồ sơ');
  });

  it('Khởi động dùng tiêu đề giới thiệu', () => {
    expect(pageTitle('/khoi-dong')).toBe(LANDING_TITLE);
  });

  it('đường dẫn lạ và /_sitemap là "Không tìm thấy trang"', () => {
    expect(pageTitle('/khong-co-trang-nay')).toBe('Không tìm thấy trang · Gia sư Tiểu học');
    expect(pageTitle('/_sitemap')).toBe('Không tìm thấy trang · Gia sư Tiểu học');
  });
});
