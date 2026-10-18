# Nối app với Supabase (lưu dữ liệu + đăng nhập + chấm bài bằng Claude trên máy chủ)

Khi chưa làm các bước dưới, app vẫn chạy: dữ liệu chỉ lưu trên máy, chấm bài dùng LM Studio ở nhà.

## 1. Tạo dự án (trên trình duyệt)
1. Vào https://supabase.com, đăng ký miễn phí, bấm **New project**.
   Đặt tên `gia-su-tieu-hoc`, chọn vùng **Southeast Asia (Singapore)**, đặt mật khẩu database (ghi lại).
2. Vào **Project Settings → API Keys**: chép **Project URL** và **Publishable key** (hoặc "anon key").
3. Mở file `.env.local` trong dự án và điền:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Hai giá trị này là công khai, được phép nằm trong app. **Không** dán "service_role / secret key" vào app.

## 2. Bật cách đăng nhập (Authentication)
1. **Authentication → Sign In / Providers → Email**: bật Email. Để đăng nhập bằng mã 6 số:
   **Authentication → Emails → Magic Link**, sửa nội dung thư cho có `{{ .Token }}` (ví dụ
   "Mã đăng nhập Gia sư Tiểu học của ba mẹ là: {{ .Token }}").
   Lưu ý: dịch vụ gửi thư có sẵn của Supabase chỉ gửi được vài thư mỗi giờ; khi có nhiều người dùng
   cần nối dịch vụ gửi thư riêng (SMTP, ví dụ Resend).
2. **Anonymous sign-ins**: bật (cho máy chưa đăng nhập vẫn chấm bài bằng Claude và lưu kết quả).
3. **Google**: tạo OAuth Client trên Google Cloud Console (loại *Web application*), dán Client ID và
   Client Secret vào **Authentication → Providers → Google**. Ở Google Cloud, thêm Redirect URI là
   `https://xxxx.supabase.co/auth/v1/callback`.
4. **Authentication → URL Configuration → Redirect URLs**: thêm
   `exp://**` (để thử trong Expo Go) và `giasutieuhoc://**` (bản app build riêng).

## 3. Tạo bảng và đưa hàm chấm bài lên (chạy trong Terminal, tại thư mục dự án)
```
npx supabase login
npx supabase link --project-ref xxxx
npx supabase db push
npx supabase secrets set ANTHROPIC_API_KEY=<key Claude, có sẵn trong .env.local>
npx supabase functions deploy cham-bai
```
- `db push` tạo bảng `children` (hồ sơ bé) và `gradings` (lịch sử chấm) trong `supabase/migrations/`,
  có khoá bảo mật: mỗi tài khoản chỉ đọc/ghi được dữ liệu của mình. Ảnh bài làm không được lưu.
- Hàm `cham-bai` nằm ở `supabase/functions/cham-bai/`, lời dặn chấm bài dùng chung với app ở
  `supabase/functions/_shared/cham-bai.ts`.

## 4. Khởi động lại Expo
Tắt và mở lại máy chủ Expo để app đọc cấu hình mới, rồi Reload app trên điện thoại.
