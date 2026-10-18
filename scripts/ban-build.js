// Build / cập nhật app với tên dạng "GiaSuTieuHoc_<version>" (version lấy từ app.json).
//
//   npm run build:preview            build APK Android bản preview
//   npm run build:dev                build bản thử (development) Android
//   npm run update:preview -- "Ghi chú thay đổi"
//   npm run version:set -- 0.2.0     đổi version (sau đó phải build lại)
//
// Lưu ý: version mới = "runtime" mới, nên máy đang cài bản cũ KHÔNG nhận được cập nhật của
// version mới; phải build và cài lại một lần.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const APP_PREFIX = 'GiaSuTieuHoc';
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const version = appJson.expo.version;
const buildName = `${APP_PREFIX}_${version}`;

const [command, ...rest] = process.argv.slice(2);

function eas(args) {
  console.log(`> eas ${args.join(' ')}`);
  execFileSync('npx', ['eas-cli@latest', ...args], { stdio: 'inherit' });
}

switch (command) {
  case 'build': {
    const profile = rest[0] ?? 'preview';
    const platform = rest[1] ?? 'android';
    eas(['build', '--profile', profile, '--platform', platform, '--message', `${buildName} (${profile})`]);
    break;
  }
  case 'update': {
    const note = rest.join(' ').trim();
    eas([
      'update',
      '--branch',
      'preview',
      '--environment',
      'preview',
      '--message',
      note ? `${buildName}: ${note}` : buildName,
    ]);
    break;
  }
  case 'version': {
    const next = rest[0];
    if (!/^\d+\.\d+\.\d+$/.test(next ?? '')) {
      console.error('Nhập version dạng 0.2.0, ví dụ: npm run version:set -- 0.2.0');
      process.exit(1);
    }
    appJson.expo.version = next;
    fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
    console.log(`Đã đổi version: ${version} → ${next} (${APP_PREFIX}_${next}). Nhớ build lại.`);
    break;
  }
  default:
    console.log(`Bản hiện tại: ${buildName}`);
}
