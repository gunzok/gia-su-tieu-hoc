# Giọng đọc AI Google (Chirp 3 HD)

Gói Plus nghe cô/thầy đọc bằng giọng AI của Google. Gói miễn phí, mất mạng hoặc máy chủ lỗi
thì app tự đọc bằng giọng có sẵn trên điện thoại.

- Hàm máy chủ: `supabase/functions/doc-loi` (khoá Google chỉ nằm ở Supabase secret).
- Âm thanh được lưu ở kho `giong-doc`: câu nào đã đọc rồi thì nghe lại không tốn phí.
- Đổi giọng: sửa tên giọng trong `voices` ở đầu file `supabase/functions/doc-loi/index.ts`
  (cô: `vi-VN-Chirp3-HD-Aoede`, thầy: `vi-VN-Chirp3-HD-Charon`), rồi triển khai lại hàm.
- Giá: 1 triệu ký tự đầu mỗi tháng miễn phí, sau đó khoảng 30 USD / 1 triệu ký tự.

## Cài đặt (làm một lần)

1. Vào https://console.cloud.google.com, tạo dự án mới (ví dụ "gia-su-tieu-hoc").
2. Gắn tài khoản thanh toán (Billing) cho dự án. Google bắt buộc có thẻ dù đang trong phần miễn phí.
3. Bật API: tìm "Cloud Text-to-Speech API" > Enable.
4. Tạo khoá: APIs & Services > Credentials > Create credentials > API key.
   Bấm vào khoá vừa tạo > API restrictions > Restrict key > chỉ chọn "Cloud Text-to-Speech API" > Save.
5. Nên đặt giới hạn chi tiêu: Billing > Budgets & alerts > tạo ngân sách (ví dụ 10 USD/tháng) để nhận cảnh báo.
6. Trong thư mục dự án, chạy (thay `KHOA_GOOGLE` bằng khoá vừa tạo):

   ```bash
   npx supabase secrets set GOOGLE_TTS_API_KEY=KHOA_GOOGLE
   npx supabase db push
   npx supabase functions deploy doc-loi
   ```

7. App dùng `expo-audio` (có mã gốc) nên cần build lại bản 0.2.0: `npm run build:preview`.
