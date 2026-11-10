# Triển khai bản web (Cloudflare Pages)

Bản web là file tĩnh (`app.json` → `web.output = "single"`): một `index.html` + JS/ảnh trong `dist/`.
Không cần máy chủ Node. Mọi việc AI và dữ liệu vẫn chạy ở Supabase.

```
gộp PR vào main ──▶ CI xanh ──▶ CD - Web: npm run build:web ──▶ quét khoá bí mật ──▶ wrangler pages deploy
```

Workflow: `.github/workflows/cd-web.yml`. Chưa cài đặt (thiếu biến `CLOUDFLARE_PAGES_PROJECT`) thì job deploy tự bỏ qua.

## Cài đặt một lần (chủ dự án, khoảng 15 phút)

### 1. Cloudflare

1. dash.cloudflare.com → **Workers & Pages** → Create → Pages → **Direct Upload** (không nối Git; GitHub Actions sẽ tải lên).
   Đặt tên dự án, ví dụ `gia-su-tieu-hoc` → có ngay địa chỉ `https://gia-su-tieu-hoc.pages.dev` (HTTPS sẵn).
2. Lấy **Account ID**: trang Workers & Pages, cột phải.
3. Tạo **API token**: My Profile → API Tokens → Create Token → mẫu *Edit Cloudflare Workers* hoặc Custom với quyền
   `Account › Cloudflare Pages › Edit`. Chỉ chọn đúng tài khoản này.
4. (Tuỳ chọn) Tên miền riêng: dự án Pages → **Custom domains** → thêm `app.<ten-mien>`, làm theo hướng dẫn DNS.
5. Thống kê dùng: dự án Pages → **Metrics → Web Analytics → Enable** (không cookie, không thu dữ liệu cá nhân).

### 2. GitHub (Settings → Secrets and variables → Actions)

| Tên | Loại | Giá trị |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | token ở bước 1.3 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Account ID ở bước 1.2 |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | tên dự án Pages, vd `gia-su-tieu-hoc` |
| `WEB_URL` | Variable | địa chỉ web, vd `https://gia-su-tieu-hoc.pages.dev` |
| `EXPO_PUBLIC_SUPABASE_URL` | Variable | như trong `.env.local` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable | khoá **publishable** (công khai) như trong `.env.local` |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Variable | email hỗ trợ cho người dùng thử |
| `EXPO_PUBLIC_SENTRY_DSN` | Variable | (tuỳ chọn) DSN Sentry, xem phần Theo dõi lỗi |

Không bao giờ đặt `ANTHROPIC_API_KEY`, service role hay khoá Google vào đây. Workflow dừng deploy nếu thấy chuỗi nhạy cảm trong `dist/`.

Environment `web-production` được tạo tự động ở lượt chạy đầu; muốn duyệt tay mỗi lần thì bật Required reviewers cho nó.

### 3. Supabase (cho đúng địa chỉ web)

Thay `<WEB>` bằng địa chỉ thật (vd `https://gia-su-tieu-hoc.pages.dev`):

- **Auth → URL Configuration**: Site URL = `<WEB>`; Redirect URLs thêm `<WEB>/**`.
- **Google Cloud Console → OAuth client**: Authorized JavaScript origins thêm `<WEB>`.
- **Auth → Attack Protection**: bật CAPTCHA (Turnstile của Cloudflare miễn phí) và giới hạn tốc độ đăng ký.
- Secrets hàm Edge (chủ dự án tự chạy):

```bash
npx supabase secrets set ALLOWED_ORIGINS=<WEB> WEB_CHI_NGUOI_DUOC_MOI=true GIOI_HAN_CHUNG_NGAY=300
```

- Thêm người được mời (SQL Editor, email chữ thường):

```sql
insert into public.moi_dung_thu (email, ghi_chu) values ('ba.me@gmail.com', 'nhà bạn A');
```

## Deploy

- Tự động: gộp PR vào `main` → tab Actions → **CD - Web** chạy xong là bản mới đã lên.
- Chạy tay: Actions → CD - Web (Cloudflare Pages) → Run workflow (nhánh `main`).
- Từ máy (khi cần gấp): `npm run build:web && npx wrangler@4 pages deploy dist --project-name=<tên dự án> --branch=main`.

## Quay lại bản cũ

Cloudflare giữ mọi bản đã deploy. Dự án Pages → **Deployments** → chọn bản trước → **⋯ → Rollback to this deployment**.
Có hiệu lực ngay, không cần build lại. Sau đó sửa lỗi trên `main` như bình thường.

## Chạy thử bản build ở máy

```bash
npm run build:web
npx wrangler@4 pages dev dist --port 8788
```

`wrangler pages dev` đọc đúng `public/_redirects` (mọi đường dẫn về `index.html`) và `public/_headers` như trên Cloudflare.
(Cấu hình `web-dist` trong `.claude/launch.json`.)

## Theo dõi lỗi, thống kê, chi phí (GIA-72)

- **Lỗi**: tạo dự án Sentry (gói miễn phí, nền tảng *Browser JavaScript*) → lấy DSN → đặt biến `EXPO_PUBLIC_SENTRY_DSN` → deploy lại.
  Code ở `src/lib/monitoring.web.ts`: tải Sentry Loader Script, tắt dữ liệu cá nhân, bỏ query/hash khỏi URL, không ghi màn hình.
  App điện thoại không bị ảnh hưởng (`monitoring.ts` để trống).
  Thử: mở web, gõ trong Console `setTimeout(() => { throw new Error('thu sentry') })`, lỗi hiện trên Sentry sau ít phút.
- **Thống kê dùng**: Cloudflare Web Analytics (bước 1.5) cho số lượt vào. Số lượt chấm/Hỏi cô theo ngày lấy từ Supabase:

```sql
select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as ngay, count(*) as luot_cham, count(distinct owner_id) as nguoi
from public.gradings group by 1 order by 1 desc limit 14;
```

- **Cảnh báo chi phí**: Google Cloud Console → Billing → **Budgets & alerts** cho project có khoá Gemini (vd 5 USD/tháng, báo ở 50/90/100%).
  Claude: console.anthropic.com → Settings → Limits → đặt hạn mức chi tiêu tháng và email cảnh báo.
  Ngoài ra máy chủ đã có cầu dao `GIOI_HAN_CHUNG_NGAY` cho bản web.

## Hostinger (dự phòng)

`public/.htaccess` đã có sẵn trong `dist/` (chuyển HTTPS, mọi đường dẫn về `index.html`, nén, cache).
Tải toàn bộ nội dung `dist/` (kể cả file ẩn `.htaccess`) vào `public_html`.
