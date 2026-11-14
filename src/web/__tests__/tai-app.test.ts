import { APK_LATEST_URL, RELEASES_URL } from '@/web/screens/tai-app-links';

// Dự án không cài kiểu của Node, nên khai báo phần nhỏ cần dùng (test chạy trong Jest trên Node).
declare const require: (id: string) => unknown;
declare const __dirname: string;
const fs = require('fs') as { readFileSync: (file: string, encoding: 'utf8') => string };
const path = require('path') as { join: (...parts: string[]) => string };

// Trang "Tải app Android" và workflow phát hành phải dùng cùng một tên file APK,
// nếu không link "bản mới nhất" sẽ trả về 404 (GIA-79).
describe('trang tải app Android', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../../../.github/workflows/eas-build.yml'), 'utf8');
  const apkName = workflow.match(/^\s*APK_NAME:\s*(\S+)\s*$/m)?.[1];

  it('workflow đặt tên file APK cố định', () => {
    expect(apkName).toBe('GiaSuTieuHoc.apk');
  });

  it('link tải trỏ đúng file ở release mới nhất', () => {
    expect(APK_LATEST_URL).toBe(`${RELEASES_URL}/download/${apkName}`);
  });
});
