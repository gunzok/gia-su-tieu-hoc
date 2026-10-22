# Chấm bài bằng Gemini (gói miễn phí, để thử) — GSTH-039

Máy chủ (`cham-bai`, `hoi-co`) thử AI theo thứ tự trong secret `AI_THU_TU`, mặc định `gemini,claude`:
Gemini lỗi (hết lượt miễn phí, quá tải…) thì thử Claude; cả hai lỗi thì báo bé thử lại và trả lại lượt chấm.
App không còn dùng LM Studio trên máy tính ở nhà.

- Mô hình: `gemini-3.8-flash` (Interactions API), sửa ở `supabase/functions/_shared/gemini.ts`.
- **Lưu ý quyền riêng tư:** gói miễn phí cho phép Google dùng nội dung gửi lên để cải thiện sản phẩm.
  Chỉ dùng khi thử trong gia đình. Trước khi mở cho người dùng thật: bật thanh toán cho Gemini
  (gói trả phí không dùng dữ liệu như vậy) hoặc chuyển sang Claude (`AI_THU_TU=claude,gemini`).
- Giới hạn lượt miễn phí mỗi ngày xem trong Google AI Studio (theo dự án, đặt lại lúc 0 giờ giờ Thái Bình Dương).

## Cài đặt (làm một lần)

1. Vào https://aistudio.google.com/apikey, đăng nhập Google, bấm **Create API key**.
   Nên tạo trong một dự án Google Cloud **chưa bật thanh toán** để chắc chắn chỉ dùng gói miễn phí.
2. Trong thư mục dự án, tự gõ (thay `KHOA_GEMINI` bằng khoá vừa tạo, không dán khoá vào chat):

   ```bash
   npx supabase secrets set GEMINI_API_KEY=KHOA_GEMINI
   npx supabase functions deploy cham-bai
   npx supabase functions deploy hoi-co
   ```

3. Đổi thứ tự AI (tuỳ chọn): `npx supabase secrets set AI_THU_TU=claude,gemini`.
