// GIA-78 (ADR-007): web mở cho mọi người. Kiểm cấu hình tĩnh cho máy tìm kiếm và luật máy chủ khi tắt danh sách mời,
// đồng thời chốt rằng app điện thoại (không gửi Origin) không bị ảnh hưởng dù danh sách mời bật hay tắt.
import { inviteDecision, isBrowserRequest } from '../../../supabase/functions/_shared/gioi-han';

// Dự án không cài kiểu của Node (@types/node) nên lấy fs qua jest, chỉ khai báo phần cần dùng. Jest chạy ở gốc repo.
const fs = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
const read = (file: string) => fs.readFileSync(`${process.cwd()}/${file}`, 'utf8');

describe('cho máy tìm kiếm (GIA-78)', () => {
  it('robots.txt cho phép thu thập, không còn Disallow: /', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  });

  it('_headers không còn X-Robots-Tag noindex nhưng vẫn giữ header bảo mật', () => {
    const headers = read('public/_headers');
    expect(headers).not.toMatch(/^\s*X-Robots-Tag:/m);
    expect(headers).toMatch(/X-Frame-Options: DENY/);
    expect(headers).toMatch(/Strict-Transport-Security/);
  });
});

describe('tắt danh sách mời (WEB_CHI_NGUOI_DUOC_MOI=false)', () => {
  const web = { enforce: false, browser: true, invitedEmails: [] as string[] };

  it('người dùng web ẩn danh hoặc email bất kỳ đều được dùng', () => {
    expect(inviteDecision({ ...web, anonymous: true, email: null })).toBeNull();
    expect(inviteDecision({ ...web, anonymous: false, email: 'nguoi.moi@gmail.com' })).toBeNull();
  });

  it('app điện thoại (không gửi Origin) luôn được dùng, dù danh sách mời bật hay tắt', () => {
    const app = { browser: isBrowserRequest(null), anonymous: true, email: null, invitedEmails: [] };
    expect(app.browser).toBe(false);
    expect(inviteDecision({ ...app, enforce: true })).toBeNull();
    expect(inviteDecision({ ...app, enforce: false })).toBeNull();
  });
});
