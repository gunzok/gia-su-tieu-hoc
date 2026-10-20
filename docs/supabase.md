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
3. **Google**: làm theo mục 2.3 bên dưới.
4. **Authentication → URL Configuration → Redirect URLs**: thêm
   `exp://**` (để thử trong Expo Go) và `giasutieuhoc://**` (bản app build riêng).

### 2.3. Bật đăng nhập Google (chủ dự án tự làm, khoảng 15 phút)

App mở trang đăng nhập Google trong trình duyệt nhỏ, Google trả về Supabase, Supabase trả phiên
đăng nhập về app qua link `giasutieuhoc://dang-nhap`. Vì vậy chỉ cần **một** OAuth Client loại
*Web application*; không cần tạo client iOS/Android (chỉ cần khi sau này đổi sang nút Google
"gốc" của điện thoại).

Client Secret là khoá bí mật: chỉ dán vào Supabase Dashboard, **không** dán vào code, `.env.local`,
tin nhắn hay bảng việc.

**A. Google Cloud Console** (https://console.cloud.google.com)
1. Chọn hoặc tạo project (ví dụ `gia-su-tieu-hoc`).
2. **APIs & Services → OAuth consent screen** (hoặc **Google Auth Platform → Branding**):
   - Loại người dùng: **External**.
   - Tên app: `Gia sư Tiểu học`, email hỗ trợ: email của ba mẹ/chủ dự án.
   - **Authorized domains**: thêm `supabase.co`.
   - **Data Access / Scopes**: giữ mặc định `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Khi còn thử nghiệm (Testing): vào **Audience → Test users** thêm email Google sẽ dùng để thử.
     Muốn ai cũng đăng nhập được thì bấm **Publish app** (với 3 quyền cơ bản trên Google thường không
     cần duyệt lâu).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, tên: `Supabase`.
   - **Authorized JavaScript origins**: để trống.
   - **Authorized redirect URIs**: thêm đúng dòng này (chép nguyên, không thừa dấu `/` cuối):
     ```
     https://ssdotdqxdzxphrkxdxux.supabase.co/auth/v1/callback
     ```
   - Bấm **Create**. Google hiện **Client ID** (đuôi `.apps.googleusercontent.com`) và **Client Secret**.
     Giữ cửa sổ này mở để chép ở bước B.

**B. Supabase Dashboard** (project `ssdotdqxdzxphrkxdxux`)
1. **Authentication → Sign In / Providers → Google**: bật **Enable Sign in with Google**.
2. Dán **Client ID** vào ô *Client IDs* và **Client Secret** vào ô *Client Secret (for OAuth)*.
   Để tắt *Skip nonce checks*. Bấm **Save**.
3. **Authentication → URL Configuration**:
   - **Redirect URLs**: có đủ 2 dòng `giasutieuhoc://**` và `exp://**` (thêm nếu thiếu).
     Thiếu dòng này thì sau khi chọn tài khoản Google, trình duyệt sẽ mở trang Site URL
     (thường là `http://localhost:3000`) và không quay lại app.
   - **Site URL**: giữ nguyên, không ảnh hưởng app.

**C. Có cần build lại app không?**
- Không cần build lại: app đã có sẵn `scheme: giasutieuhoc` và `expo-web-browser` từ bản đầu tiên.
  Các bước A, B làm trên máy chủ nên có hiệu lực ngay.
- Bản sửa nhỏ cách đọc link trả về (ticket GSTH-012) chỉ là JavaScript: đưa lên điện thoại bằng
  cập nhật OTA (skill `eas-release`) sau khi chủ dự án duyệt, không cần build mới.

**D. Thử**
1. Expo Go hoặc bản preview Android / máy giả lập iOS: mở **Ba Mẹ đăng nhập → Tiếp tục với Google**.
2. iOS hỏi "… muốn dùng supabase.co để đăng nhập": bấm **Tiếp tục**. Chọn tài khoản Google.
3. Trình duyệt tự đóng, app vào màn hồ sơ bé (hoặc trang chủ nếu đã có hồ sơ).
4. Kiểm tra **Authentication → Users** trên Supabase có dòng mới, cột Provider là `google`.

Lỗi hay gặp:
- `redirect_uri_mismatch` (trang Google): Redirect URI ở bước A3 gõ sai, chép lại đúng dòng trên.
- `Access blocked … has not completed the Google verification process`: email chưa có trong *Test users*.
- `Unsupported provider: provider is not enabled`: chưa bật hoặc chưa bấm Save ở bước B1–B2.
- Trình duyệt không đóng, hiện trang localhost: thiếu Redirect URLs ở bước B3.

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
