// GIA-82: trang đọc trước (chính sách, điều khoản, tải app) không bị hộp đồng ý điều khoản che.
import { isReadingPath } from '@/web/consent-gate';

jest.mock('@/global.css', () => ({}));
jest.mock('@/lib/supabase', () => ({ supabase: null }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ signedIn: false }) }));

describe('trang đọc được trước khi đồng ý điều khoản', () => {
  it.each(['/chinh-sach', '/dieu-khoan', '/tai-app'])('%s không bị che', (pathname) => {
    expect(isReadingPath(pathname)).toBe(true);
  });

  it.each(['/', '/lam-bai', '/tai-khoan', '/tai-app-khac'])('%s vẫn phải đồng ý trước', (pathname) => {
    expect(isReadingPath(pathname)).toBe(false);
  });
});
