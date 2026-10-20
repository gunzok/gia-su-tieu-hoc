# Giọng đọc AI Google (Chirp 3 HD)

Cô/thầy đọc bằng giọng AI của Google. Mất mạng, máy chủ lỗi hoặc hết phần miễn phí tháng này
thì app tự đọc bằng giọng có sẵn trên điện thoại.

- Tạm thời mọi người dùng đều nghe giọng Google (`CLOUD_VOICE_FOR_ALL` trong `src/lib/speech.ts`).
  Khi RevenueCat có khoá thật, đổi thành `false` để chỉ gói Plus được nghe.
- Tự dừng khi gần hết phần miễn phí: hàm đếm ký tự đã gửi Google mỗi tháng (bảng `giong_doc_thang`),
  quá 900 nghìn thì ngừng gọi Google cho tới tháng sau (giờ UTC). Câu đã có sẵn trong kho không tính.
  Đổi mức: `npx supabase secrets set GOOGLE_TTS_MONTHLY_CHARS=...`
- Vẫn nên đặt cảnh báo ngân sách trên Google Cloud để chắc chắn (bước 5 bên dưới).

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

## Dự phòng ElevenLabs (GSTH-034)

Khi Google lỗi hoặc đã dùng hết mức tháng, hàm `doc-loi` tự đọc bằng ElevenLabs
(mẫu `eleven_flash_v2_5`, tiếng Việt). ElevenLabs cũng lỗi hoặc hết mức thì app đọc bằng giọng trên máy.
App không cần cập nhật, chỉ cần triển khai lại hàm.

1. Vào https://elevenlabs.io > Developers > API Keys > tạo khoá (nên giới hạn quyền chỉ Text to Speech
   và đặt hạn mức credit cho khoá).
2. Chạy (thay `KHOA_ELEVENLABS` bằng khoá vừa tạo; tự gõ, không dán khoá vào chat):

   ```bash
   npx supabase secrets set ELEVENLABS_API_KEY=KHOA_ELEVENLABS
   npx supabase functions deploy doc-loi
   ```

- Mức tháng mặc định 10 nghìn ký tự (vừa gói miễn phí). Gói trả phí thì nâng:
  `npx supabase secrets set ELEVENLABS_MONTHLY_CHARS=...`
- Đổi giọng: `ELEVENLABS_VOICE_CO`, `ELEVENLABS_VOICE_THAY` (mã giọng trong Voice Library).
  Mặc định là giọng có sẵn Sarah (cô) và George (thầy).
- Bộ đếm nằm chung bảng `giong_doc_thang`, dòng `elevenlabs:2026-10`.
