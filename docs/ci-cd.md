# CI/CD của Gia sư Tiểu học (GitHub Actions + EAS + Supabase)

## Tóm tắt luồng

```
Nhánh ticket ──PR──▶ main ──▶ phát hành
                │            │
         CI (bắt buộc)       ├─ CD - App (OTA)   → EAS Update, nhánh `preview`   (đổi JS/TS, ảnh, chữ)
                             ├─ CD - Supabase    → db push + functions deploy      (đổi supabase/)
                             └─ gắn tag vX.Y.Z   → EAS Build Android production + GitHub Release
```

| Workflow | Khi nào chạy | Làm gì |
|---|---|---|
| `ci.yml` | Mọi PR vào `main`, mọi lần đẩy lên `main` | tsc, lint, Jest, `expo export` thử, `deno check` hàm Supabase, quét khoá lộ (gitleaks), `npm audit` |
| `cd-app.yml` | Đẩy lên `main` (trừ khi chỉ đổi docs/supabase/.github) | Chạy lại CI, xanh thì `eas update --branch preview` |
| `cd-supabase.yml` | Đẩy lên `main` có đổi `supabase/**` | CI xanh → `db push --dry-run` (kế hoạch hiện trong Summary của lượt chạy) → chờ duyệt → `db push` → `functions deploy`. Chỉ chạy từ `main` |
| `eas-build.yml` | Chạy tay, hoặc gắn tag `vX.Y.Z` | Kiểm tra tag khớp `app.json`, `eas build` (chạy trên máy chủ Expo), tạo GitHub Release |
| `dependabot.yml` | Hằng tuần | PR cập nhật GitHub Actions và thư viện npm (không đụng bộ Expo/React Native) |

Job `CI đạt` là "cổng" duy nhất gom kết quả; dùng nó làm required check.

## Cài đặt một lần (chủ dự án làm trên GitHub, khoảng 10 phút)

### 1. Secrets và biến (Settings → Secrets and variables → Actions)

| Tên | Loại | Lấy ở đâu | Dùng cho |
|---|---|---|---|
| `EXPO_TOKEN` | Secret | expo.dev → Account settings → Access tokens | OTA + build |
| `SUPABASE_ACCESS_TOKEN` | Secret | supabase.com → Account → Access Tokens | deploy Supabase |
| `SUPABASE_DB_PASSWORD` | Secret | mật khẩu database lúc tạo dự án | `db push` |
| `SUPABASE_PROJECT_ID` | **Variable** | `ssdotdqxdzxphrkxdxux` (có trong `docs/supabase.md`) | deploy Supabase |

**Không** đưa `ANTHROPIC_API_KEY`, `REVENUECAT_SECRET_KEY`, khoá Google hay service role vào GitHub. Các khoá đó
vẫn đặt bằng `npx supabase secrets set ...` như cũ. Biến `EXPO_PUBLIC_*` của app vẫn nằm ở EAS (`npm run env:eas`).

### 2. Environments (Settings → Environments)

- `preview`: dùng cho OTA và build thử, không cần duyệt.
- `production`: dùng cho deploy Supabase và build theo tag. Bật **Required reviewers** (chính chủ dự án) để mỗi lần
  động vào database thật phải bấm duyệt.
  Nên đặt thêm **Deployment branches and tags** = *Selected* (chỉ `main` và tag `v*`) để không nhánh nào khác dùng được môi trường này.

### 3. Bảo vệ nhánh `main` (Settings → Branches → Add rule cho `main`)

- Require a pull request before merging.
- Require status checks to pass → chọn **CI đạt**.
- Require branches to be up to date; (tuỳ chọn) Do not allow bypassing.

Thiếu bước này thì CI chỉ báo chứ không chặn được ai gộp mã lỗi vào `main`.

## Quy trình hằng ngày

1. Làm trên nhánh `ticket/GSTH-xxx`, đẩy lên GitHub, mở PR vào `main` (mẫu PR có sẵn checklist).
2. CI xanh + duyệt → gộp. `CD - App` tự gửi bản OTA lên nhánh `preview`; điện thoại tắt hẳn app rồi mở lại 1-2 lần để nhận.
3. Có đổi `supabase/`: sau khi gộp, vào tab Actions, mở **Summary** của lượt chạy để đọc danh sách migration sắp đẩy, rồi bấm **Review deployments** để duyệt.

## Khi nào KHÔNG đi OTA mà phải build lại

`runtimeVersion` theo version app, nên cập nhật OTA chỉ hợp với bản đã cài cùng version. Đổi thư viện có mã gốc
(ví dụ `expo-audio`), đổi plugin, quyền, hoặc phần native của `app.json` thì:

1. `npm run version:set -- 0.5.0`, commit, gộp vào `main`.
2. Gắn tag khớp version: `git tag v0.5.0 && git push origin v0.5.0` → `EAS Build` build Android production, chờ build xong rồi mới tạo Release (build lỗi thì không có Release).
   (Muốn APK cài thử: Actions → EAS Build → Run workflow → profile `preview`.)
3. Cài lại bản build mới lên điện thoại; bản cũ không nhận được OTA của version mới.

Lưu ý: `cd-app.yml` **không tự phân biệt** thay đổi native; bước nâng version là trách nhiệm của người làm PR
(đã có dòng nhắc trong mẫu PR).

## Giới hạn hiện tại và việc nên làm tiếp

- iOS thật: chưa có tài khoản Apple Developer nên chưa có bước `eas submit`/TestFlight. iOS chỉ build cho máy giả lập
  (Run workflow → platform `ios`, profile `preview-simulator`). Android chưa nộp lên Google Play (`eas submit` thêm sau khi có tài khoản).
- `npm audit` chặn ở mức *critical*. Hiện có 3 lỗ hổng *high* nằm ở thư viện con của Expo (vd `zod`); CI chỉ cảnh báo.
  Nâng SDK Expo sẽ xử lý dần.
- Chưa bật CodeQL / dependency-review vì cần GitHub Advanced Security nếu kho ở chế độ riêng tư. Kho công khai thì thêm được miễn phí.
- Chưa có E2E trên máy giả lập trong CI; kiểm thử giao diện vẫn làm bằng tay (QA) theo `.claude/SKILLS.md`.
- Quy tắc cũ "chỉ làm local, không push GitHub" của quy trình ticket (CLAUDE.md, skill `eas-release`) áp dụng cho việc
  *Claude tự đẩy*; từ khi có CI/CD, chủ dự án quyết định khi nào đẩy nhánh và mở PR.
