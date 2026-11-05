// Build / cập nhật app với tên dạng "GiaSuTieuHoc_<version>" (version lấy từ app.json).
//
//   npm run build:preview            build APK Android bản preview
//   npm run build:dev                build bản thử (development) Android
//   npm run build:ios-sim            build bản iOS hoàn chỉnh cho iPhone giả lập (không cần tài khoản Apple)
//   npm run update:preview -- "Ghi chú thay đổi"
//   npm run version:set -- 0.2.0     đổi version ở app.json và package.json (sau đó phải build lại)
//   npm run env:eas                  đưa các khoá EXPO_PUBLIC_ trong .env.local lên EAS
//                                    (máy chủ build không đọc được .env.local)
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
    // Giữ version trong package.json (và package-lock.json) trùng app.json.
    execFileSync('npm', ['version', next, '--no-git-tag-version', '--allow-same-version'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
    });
    console.log(`Đã đổi version: ${version} → ${next} (${APP_PREFIX}_${next}). Nhớ build lại.`);
    break;
  }
  case 'env': {
    // Chỉ đưa khoá công khai (EXPO_PUBLIC_…, vốn nằm trong app). Không bao giờ đưa ANTHROPIC_API_KEY
    // hay khoá bí mật khác; cờ thử Plus (DEV_PLUS) cũng bỏ qua.
    const envPath = path.join(__dirname, '..', '.env.local');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const vars = lines
      .map((line) => line.match(/^(EXPO_PUBLIC_[A-Z0-9_]+)=(.*)$/))
      .filter((match) => match && match[2].trim() && match[1] !== 'EXPO_PUBLIC_DEV_PLUS')
      .map((match) => [match[1], match[2].trim()]);
    for (const [name, value] of vars) {
      eas([
        'env:create',
        '--name',
        name,
        '--value',
        value,
        '--environment',
        'preview',
        '--environment',
        'production',
        '--visibility',
        'plaintext',
        '--force',
        '--non-interactive',
      ]);
    }
    console.log(`Đã đưa ${vars.length} khoá công khai lên EAS: ${vars.map(([name]) => name).join(', ')}`);
    break;
  }
  default:
    console.log(`Bản hiện tại: ${buildName}`);
}
