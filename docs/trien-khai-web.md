# Triển khai bản web (Cloudflare Workers, file tĩnh)

Bản web là file tĩnh (`app.json` → `web.output = "single"`): một `index.html` + JS/ảnh trong `dist/`.
Không cần máy chủ Node. Mọi việc AI và dữ liệu vẫn chạy ở Supabase.

Cloudflare đã gộp Pages vào Workers: từ wrangler 4.x, "dự án Pages" mới thực chất là một **Worker có file tĩnh**.
Cấu hình ở `wrangler.jsonc` (tên Worker `gia-su-tieu-hoc`, thư mục `dist/`, chế độ SPA: đường dẫn nào không có file
thì trả `index.html`). Header bảo mật và cache ở `public/_headers`; `public/.assetsignore` giữ `.htaccess` không bị đưa lên.

```
gộp PR vào main ──▶ CI xanh ──▶ CD - Web: npm run build:web ──▶ quét khoá bí mật ──▶ wrangler deploy
```

Workflow: `.github/workflows/cd-web.yml`. Chưa có biến `WEB_URL` thì job deploy tự bỏ qua.

## Cài đặt một lần (chủ dự án)

### 1. Cloudflare

1. Worker `gia-su-tieu-hoc` đã được tạo (10/11) ở tài khoản `luckychan2990@gmail.com`, địa chỉ
   `https://gia-su-tieu-hoc.giasutieuhoc.workers.dev` (HTTPS sẵn). Account ID: `b4de8bb0d6b3d86cadd474dcdc243502`
   (không phải bí mật; cũng thấy trong địa chỉ trang dashboard `dash.cloudflare.com/<account id>/…`).
2. Tạo **API token** cho GitHub: dashboard → **Manage account → Account API tokens** (hoặc biểu tượng tài khoản →
   **My Profile → API Tokens**) → **Create Token** → mẫu **Edit Cloudflare Workers** → *Account Resources*: chỉ tài khoản này;
   *Zone Resources*: All zones (hoặc bỏ nếu chưa có tên miền) → Continue → Create. Token chỉ hiện một lần.
3. (Tuỳ chọn) Tên miền riêng: **Compute → Workers & Pages** → `gia-su-tieu-hoc` → **Settings → Domains & Routes → Add →
   Custom domain** (tên miền phải đang dùng DNS của Cloudflare).
4. Thống kê dùng: Worker `gia-su-tieu-hoc` → **Metrics** (số lượt gọi); muốn số người xem trang thì bật
   **Web Analytics** ở tài khoản và thêm site (không cookie, không thu dữ liệu cá nhân).

### 2. GitHub (Settings → Secrets and variables → Actions, hoặc lệnh `gh`)

| Tên | Loại | Giá trị |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | token ở bước 1.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Account ID ở bước 1.1 |
| `WEB_URL` | Variable | địa chỉ web, vd `https://gia-su-tieu-hoc.giasutieuhoc.workers.dev` (bật deploy) |
| `EXPO_PUBLIC_SUPABASE_URL` | Variable | đã đặt 10/11 |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Variable | đã đặt 10/11 (khoá **publishable**, công khai) |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Variable | email hỗ trợ cho người dùng thử |
| `EXPO_PUBLIC_SENTRY_DSN` | Variable | (tuỳ chọn) DSN Sentry, xem phần Theo dõi lỗi |

Không bao giờ đặt `ANTHROPIC_API_KEY`, service role hay khoá Google vào đây. Workflow dừng deploy nếu thấy chuỗi nhạy cảm trong `dist/`.

Environment `web-production` được tạo tự động ở lượt chạy đầu; muốn duyệt tay mỗi lần thì bật Required reviewers cho nó.

### 3. Supabase (cho đúng địa chỉ web)

Thay `<WEB>` bằng địa chỉ thật (vd `https://gia-su-tieu-hoc.giasutieuhoc.workers.dev`):

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

- Tự động: gộp PR vào `main` → tab Actions → **CD - Web (Cloudflare)** chạy xong là bản mới đã lên.
- Chạy tay: Actions → CD - Web (Cloudflare) → Run workflow (nhánh `main`).
- Từ máy (khi cần gấp, sau `npx wrangler@4 login`): `npm run build:web && npx wrangler@4 deploy`.

## Quay lại bản cũ

Cloudflare giữ các phiên bản đã deploy. Cách nhanh: `npx wrangler@4 rollback` (chọn phiên bản trước), hoặc dashboard →
**Compute → Workers & Pages** → `gia-su-tieu-hoc` → **Deployments** → chọn bản trước → **Rollback**.
Có hiệu lực ngay, không cần build lại. Sau đó sửa lỗi trên `main` như bình thường.

## Chạy thử bản build ở máy

```bash
npm run build:web
npx wrangler@4 dev --port 8788
```

`wrangler dev` chạy đúng như trên Cloudflare: chế độ SPA của `wrangler.jsonc` và header trong `public/_headers`.
(Cấu hình `web-dist` trong `.claude/launch.json`.)

## Theo dõi lỗi, thống kê, chi phí (GIA-72)

- **Lỗi**: tạo dự án Sentry (gói miễn phí, nền tảng *Browser JavaScript*) → lấy DSN → đặt biến `EXPO_PUBLIC_SENTRY_DSN` → deploy lại.
  Code ở `src/lib/monitoring.web.ts`: tải Sentry Loader Script, tắt dữ liệu cá nhân, bỏ query/hash khỏi URL, không ghi màn hình.
  App điện thoại không bị ảnh hưởng (`monitoring.ts` để trống).
  Thử: mở web, gõ trong Console `setTimeout(() => { throw new Error('thu sentry') })`, lỗi hiện trên Sentry sau ít phút.
- **Thống kê dùng**: Cloudflare Web Analytics (bước 1.4) cho số lượt vào. Số lượt chấm/Hỏi cô theo ngày lấy từ Supabase:

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
