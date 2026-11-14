# Chấm bài bằng Gemini (gói miễn phí, để thử) — GSTH-039

Gói Plus dùng khoá Gemini trả phí riêng: xem mục [Gói Plus dùng Gemini trả phí](#gói-plus-dùng-gemini-trả-phí-gia-77).

Máy chủ (`cham-bai`, `hoi-co`) thử AI theo thứ tự trong secret `AI_THU_TU`, mặc định `gemini,claude`:
Gemini lỗi (hết lượt miễn phí, quá tải…) thì thử Claude; cả hai lỗi thì báo bé thử lại và trả lại lượt chấm.
Máy chủ không chấm được thì app tự chấm bằng LM Studio trên máy tính ở nhà, nếu đã điền
`EXPO_PUBLIC_LMSTUDIO_URL` (GIA-54; trước đó GSTH-039 đã bỏ phần này).

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

## Gói Plus dùng Gemini trả phí (GIA-77)

Chủ dự án chốt 14/11/2026: **gói miễn phí** của app tiếp tục dùng Gemini miễn phí; **gói Plus** dùng Gemini
**trả phí** (khoá riêng, trong dự án Google Cloud đã bật thanh toán).

| Người dùng | Secret máy chủ dùng | Ghi chú |
|---|---|---|
| Gói miễn phí | `GEMINI_API_KEY` | Không bao giờ dùng khoá trả phí. Vẫn bị 5 lượt/phút, hạn mức ngày, hay 503. |
| Gói Plus | `GEMINI_API_KEY_TRA_PHI` | Chưa đặt thì tạm dùng `GEMINI_API_KEY`. |

- Logic chọn khoá: `supabase/functions/_shared/gemini-key.ts` (test: `src/lib/__tests__/gemini-key.test.ts`).
- Khoá trả phí không có hạn mức ngày như gói miễn phí, nên máy chủ **không né** model "hết lượt ngày" khi chấm
  cho Plus; vẫn thử lại khi 503 (quá tải) và đợi khi 429 theo phút nếu còn đủ giờ, rồi mới chuyển model / sang Claude.
- Khi đã đặt `GEMINI_API_KEY_TRA_PHI`, app điện thoại cũng hỏi RevenueCat ở mỗi lượt chấm / "Hỏi cô" để biết gói
  (trước đây chỉ hỏi khi hết lượt miễn phí). Cần `REVENUECAT_SECRET_KEY`; thiếu hoặc RevenueCat lỗi thì tính là
  gói miễn phí (dùng khoá miễn phí).
- Theo dõi chi phí: cột `gemini_key` (`free` / `paid`, null nếu lượt đó không dùng Gemini) trong bảng
  `grading_usage` (mọi lượt chấm) và `ai_usage_log` (lượt "Hỏi cô" trên web). Migration
  `20261114000000_loai_khoa_gemini.sql`. Ví dụ đếm lượt chấm trả phí hôm nay:

  ```sql
  select gemini_key, count(*), sum(pages) from grading_usage
  where created_at >= date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'
  group by gemini_key;
  ```

### Đặt khoá trả phí (chủ dự án tự làm, sau khi PR được gộp)

1. Trong Google Cloud, tạo **một dự án riêng** (ví dụ `gia-su-tieu-hoc-tra-phi`) và gắn tài khoản thanh toán
   (Billing). Không bật thanh toán cho dự án của khoá miễn phí: theo điều khoản, khoá thuộc dự án có thanh toán
   là dịch vụ trả phí, nên hai khoá phải ở hai dự án khác nhau.
2. Vào https://aistudio.google.com/apikey, chọn dự án vừa tạo, bấm **Create API key**.
3. Đặt ngân sách và cảnh báo (Billing → Budgets & alerts) cho dự án trả phí (liên quan GIA-72).
4. Trong thư mục dự án, tự gõ (thay `KHOA_TRA_PHI` bằng khoá vừa tạo, không dán khoá vào chat hay Git):

   ```bash
   npx supabase secrets set GEMINI_API_KEY_TRA_PHI=KHOA_TRA_PHI
   ```

5. Deploy migration và hàm (bước này cần chủ dự án duyệt environment `Production` khi gộp vào `main`; chạy tay thì):

   ```bash
   npx supabase db push
   npx supabase functions deploy cham-bai
   npx supabase functions deploy hoi-co
   ```

Bỏ khoá trả phí: `npx supabase secrets unset GEMINI_API_KEY_TRA_PHI` (Plus quay về khoá miễn phí).

### Điều khoản dữ liệu (tra 14/11/2026)

Nguồn: [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms), bản có hiệu lực 23/03/2026.

- **Gói miễn phí** (Unpaid Services): Google dùng nội dung gửi lên và câu trả lời để cải thiện, phát triển sản phẩm;
  người của Google có thể đọc (sau khi tách khỏi tài khoản, khoá, dự án). Google khuyên không gửi thông tin cá nhân.
- **Gói trả phí** (Paid Services, gọi API qua dự án Google Cloud có tài khoản thanh toán đang hoạt động): Google
  **không** dùng câu hỏi và câu trả lời để cải thiện sản phẩm; chỉ lưu nhật ký trong thời gian giới hạn để phát hiện
  vi phạm chính sách sử dụng và cho yêu cầu pháp lý.
- Điều khoản vẫn yêu cầu người dùng API từ 18 tuổi và app không hướng tới người dưới 18 tuổi: rủi ro R-001 trong
  `PROJECT_STATE.md` **chưa** được gỡ bởi việc chuyển sang gói trả phí.
