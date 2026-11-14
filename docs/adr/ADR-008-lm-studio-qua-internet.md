# ADR-008: Chấm bài bằng LM Studio trên máy Mac ở nhà, dùng được qua internet

- **Trạng thái**: Đề xuất (chờ chủ dự án duyệt)
- **Ngày**: 2026-11-14 (GIA-80)
- **Người quyết định**: chủ dự án
- **Liên quan**: ADR-002 (Supabase), ADR-003 (AI chấm bài), ADR-006 (mời dùng thử), GIA-54, GIA-55, GIA-70
- **Hướng dẫn cài**: [`docs/lm-studio-internet.md`](../lm-studio-internet.md)

## Bối cảnh

- Hiện nay LM Studio là bước dự phòng cuối, và **app gọi thẳng** tới máy tính trong mạng Wi-Fi nhà
  (`EXPO_PUBLIC_LMSTUDIO_URL`, `src/lib/grading.ts`, `src/lib/hoi-co.ts`). Ra khỏi nhà là không dùng được. Web đã bỏ
  LM Studio (GIA-70) vì trình duyệt của người khác không vào được mạng nhà.
- Chủ dự án muốn để máy Mac ở nhà chấm bài cho app ở bất cứ đâu, nhằm giảm phụ thuộc vào Gemini gói miễn phí
  (R-001, R-007) và giảm chi phí Claude.
- Số đo cũ: model 8B tìm đúng 14/21 lỗi trên bộ 10 ảnh mẫu (Gemini và Claude đều 21/21). Mỗi bài mất 4-8 phút; riêng
  bước chép bài 2 trang đã mất 3 phút 40 giây (`lmStudioStepTimeoutMs = 360_000`). Model 27B (`qwen/qwen3.8-27b`)
  chưa được đo lại trên bộ mẫu.
- Nguyên tắc chủ dự án đặt ra: app/web **không** gọi thẳng LM Studio, chỉ máy chủ Supabase làm việc với LM Studio, và
  khoá chỉ nằm trong Supabase secrets.

### Giới hạn thời gian quyết định cách làm (tra ngày 14/11/2026)

| Giới hạn | Giá trị | Nguồn |
|---|---|---|
| Edge Function: tổng thời gian chạy (wall clock) | **150 giây** (gói Free), **400 giây** (gói trả phí); chỉ tự host mới đổi được | [Supabase: Limits](https://supabase.com/docs/guides/functions/limits) |
| Edge Function: thời gian chờ không có phản hồi (request idle timeout) | 150 giây, quá thì trả 504 | như trên |
| Edge Function: việc chạy nền `EdgeRuntime.waitUntil` | Vẫn chịu giới hạn wall clock, CPU và bộ nhớ ở trên | [Supabase: Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) |
| Cloudflare (Tunnel đi qua proxy Cloudflare): Proxy Read Timeout | **125 giây**, chỉ gói Enterprise mới tăng được (tới 6.000 giây), quá thì lỗi 524 | [Cloudflare: Error 524](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/) |

**Kết luận:** một bài LM Studio (4-8 phút, tức 240-480 giây) dài hơn giới hạn 150 giây của gói Free, và thường dài hơn
cả 400 giây của gói trả phí. Mỗi bước gọi model (khoảng 220 giây) cũng dài hơn 125 giây của Cloudflare. Cách
"Edge Function gọi LM Studio qua đường hầm rồi chờ kết quả" vì thế **không chấm được bài**, dù chọn đường hầm nào.
Muốn chấm được thì phải tách thành việc chờ: lúc nhận bài chỉ ghi vào hàng đợi, lúc chấm xong mới trả kết quả.

## Các phương án đã xét

Mỗi phương án đường hầm (B-E) đều phải đi kèm hàng đợi (xem trên). Bảng tra ngày 14/11/2026.

| Phương án | Bảo mật | Chi phí | Khi máy ngủ/tắt | Độ trễ, giới hạn | Nguồn |
|---|---|---|---|---|---|
| **A. Máy Mac tự lấy việc** (máy Mac chỉ kết nối ra ngoài tới Supabase, lấy bài trong hàng đợi, chấm bằng LM Studio ở `localhost`, gửi kết quả về) | Tốt nhất: **không mở cổng nào, không có địa chỉ công khai**; LM Studio chỉ nghe `127.0.0.1`; máy Mac giữ một mã riêng, chỉ dùng được cho 2 hàm "lấy việc / trả kết quả" | 0 đ (Supabase Free đủ; không cần tên miền) | Bài nằm chờ trong hàng đợi; máy chủ biết máy Mac còn sống qua "nhịp tim", máy tắt thì báo bận ngay, không nhận bài | Mỗi lần gọi Edge Function dưới 2 giây nên không chạm giới hạn 150/400 giây; thời gian chấm 4-8 phút cộng thêm tối đa khoảng 10 giây chờ máy Mac hỏi việc | Supabase Limits (trên) |
| B. Cloudflare Tunnel + Access (service token) | Tốt: không mở cổng router; Cloudflare chặn mọi yêu cầu không có `CF-Access-Client-Id` / `CF-Access-Client-Secret`; thêm token LM Studio là lớp thứ hai | Tunnel và Access: 0 đ (Zero Trust Free cho dưới 50 người dùng). **Cần một tên miền đặt trên Cloudflare** (hiện web dùng `workers.dev`, chưa có tên miền riêng), khoảng 10 USD/năm | Máy ngủ thì 502/530, máy chủ phải tự nhận ra rồi xếp lại hàng đợi | 125 giây mỗi yêu cầu (gói Free), nên phải dùng `stream: true` để giữ kết nối, và vẫn vướng 150/400 giây của Edge Function. Chỉ hợp với việc ngắn như Hỏi cô (dưới 2 phút) | [Service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/), [Zero Trust plans](https://www.cloudflare.com/plans/sase-zero-trust/), Error 524 |
| C. Tailscale Funnel | Kém: Funnel mở cho **bất kỳ ai** có địa chỉ, không có lớp xác thực khách; chỉ còn token LM Studio bảo vệ; tên `*.ts.net` có thể bị dò ra | 0 đ, nhưng gói Personal **chỉ cho mục đích phi thương mại** (app có gói Plus thu tiền) | Như B | Còn là bản beta; băng thông bị giới hạn nhưng không công bố con số; chỉ dùng cổng 443/8443/10000 | [Tailscale Funnel](https://tailscale.com/kb/1223/tailscale-funnel), [Tailscale pricing FAQ](https://tailscale.com/pricing/faq) |
| D. ngrok (gói Free) | Trung bình: địa chỉ `*.ngrok-free.app` công khai; phải tự cấu hình kiểm tra header (Traffic Policy, tối đa 5 quy tắc trên gói Free) | 0 đ nhưng hạn mức **1 GB/tháng, 20.000 request/tháng**. Ảnh bài gửi dạng base64 khoảng 1-3 MB, nên chỉ đủ vài trăm bài mỗi tháng. Gói trả phí tốn tiền hằng tháng | Như B | Trang cảnh báo chỉ hiện với trình duyệt; gọi API kèm header `ngrok-skip-browser-warning` thì bỏ qua được | [ngrok Free plan limits](https://ngrok.com/docs/pricing-limits/free-plan-limits) |
| E. Mở cổng router (port forwarding) | Kém nhất: lộ IP nhà, máy Mac nhận trực tiếp mọi lượt dò quét từ internet; phải tự lo HTTPS, tường lửa, cập nhật bảo mật | 0 đ tiền dịch vụ, nhưng IP nhà thường đổi (cần DDNS); nhiều mạng gia đình nằm sau CGNAT nên có thể không mở được (cần hỏi nhà mạng) | Như B | Không có giới hạn trung gian, nhưng vẫn vướng 150/400 giây của Edge Function | (kinh nghiệm chung, không có nguồn chính thức) |

Thêm: LM Studio từ bản 0.4.0 có tuỳ chọn bắt buộc mã truy cập (`Authorization: Bearer <token>`); mặc định **tắt**
([LM Studio: Authentication](https://lmstudio.ai/docs/developer/core/authentication)). Phương án nào cũng phải bật.

## Quyết định (đề xuất)

1. **Chọn phương án A: máy Mac tự lấy việc.** Không đưa LM Studio ra internet. Không cần đường hầm, không mở cổng.
   Đây là cách duy nhất chấm được bài 4-8 phút mà vẫn giữ Supabase gói Free.
2. **Cách chạy (thiết kế, làm ở ticket code sau khi duyệt):**
   - Edge Function `cham-bai` thử AI theo `AI_THU_TU`. Khi đến lượt `lmstudio` và máy Mac đang sống (nhịp tim mới hơn
     2 phút), hàm **ghi bài vào hàng đợi** (bảng có RLS, chỉ chủ bài đọc được) và trả về ngay `202 { viec_id }`.
     Máy Mac không sống thì bỏ qua bước này và báo bận như hiện nay, lượt chấm còn nguyên.
   - Ảnh đã nằm trong Supabase Storage (bucket riêng tư). Hàng đợi chỉ giữ đường dẫn; máy Mac nhận **signed URL
     hết hạn sau 5 phút**.
   - Trên máy Mac có một chương trình nhỏ chạy nền (launchd), khoảng 10 giây gọi một lần:
     `lay-viec-lm` (nhận 1 bài, đồng thời báo nhịp tim) → chấm bằng LM Studio ở `http://127.0.0.1:1234` (có token)
     → `tra-ket-qua-lm` (gửi kết quả). Hai hàm này kiểm tra secret `MAY_NHA_TOKEN` (so sánh hằng thời gian), kiểm tra
     kết quả đúng schema rồi mới ghi. Máy Mac **không giữ** `service_role` hay khoá AI nào.
   - App hiện "Cô đang chấm trên máy ở nhà…", nhận kết quả bằng Realtime (hoặc hỏi lại mỗi 10 giây).
     Bài quá 15 phút chưa xong thì đánh dấu lỗi, trả lại lượt và báo bé thử lại.
   - Bỏ đường gọi thẳng `EXPO_PUBLIC_LMSTUDIO_URL` trong app khi đường mới chạy ổn.
3. **Vị trí trong chuỗi dự phòng:** `gemini → claude → lmstudio` (cuối cùng), bật bằng `AI_THU_TU`, mặc định **tắt**.
   Chỉ bật cho nhóm thử gia đình. Web vẫn không dùng LM Studio cho tới khi có quyết định khác (ADR-003, ADR-006).
   Trước khi bật phải đo model 27B trên bộ mẫu 10 ảnh; tìm đúng dưới 18/21 lỗi thì không bật.
4. **Phương án dự bị B** (Cloudflare Tunnel + Access) chỉ dùng nếu sau này cần việc ngắn đồng bộ (vd Hỏi cô dưới
   2 phút) và đã có tên miền trên Cloudflare. Không dùng C, D, E.

## Hệ quả

- **Dễ hơn:** không có cổng nào mở vào nhà; máy Mac tắt cũng không có địa chỉ nào để tấn công; chạy được từ mọi nơi;
  không tốn tiền dịch vụ; không bị giới hạn 150/400 giây.
- **Khó hơn:** phải viết thêm code (khoảng 3 ticket: hàng đợi và 2 hàm Edge mới; chương trình chạy trên máy Mac; app chờ
  kết quả). App chuyển từ "chờ ngay" sang "chờ có thông báo".
- **Rủi ro dữ liệu trẻ em:** ảnh bài làm và tên bé (nếu có trong ảnh) được tải về máy Mac cá nhân.
  Biện pháp: bật FileVault; chương trình **không lưu ảnh xuống đĩa** (chỉ giữ trong bộ nhớ, xoá ngay sau khi chấm);
  tắt ghi log nội dung trong LM Studio (kiểm tra mục Developer Logs); tài khoản macOS có mật khẩu và tự khoá;
  chỉ gửi đi phần cần chấm. Phải **sửa trang Chính sách riêng tư** (`src/app/chinh-sach-rieng-tu.tsx` hiện ghi
  "qua mạng Wi-Fi nhà, không đi ra Internet") trước khi bật.
- **Máy tắt, mất điện, mất mạng:** máy chủ thấy nhịp tim cũ thì không đưa bài vào hàng đợi mà chuyển báo bận như hiện
  nay. Bài đang chấm dở được trả lại hàng đợi sau 15 phút. Không bao giờ để bé chờ vô hạn.
- **Chi phí điện (ước tính, chưa đo):** máy Mac Apple Silicon chạy liên tục khoảng 5-10 W lúc chờ, vài chục W lúc
  chấm, tức khoảng 5-10 kWh/tháng, khoảng 15.000-35.000 đ/tháng (giả định khoảng 3.000 đ/kWh). Nên đo bằng ổ cắm đo
  điện trong 1 tuần.
- **Chất lượng:** model địa phương kém hơn Gemini/Claude (14/21 với 8B). App phải luôn hiện dòng "chấm bằng AI trên máy
  ở nhà, có thể kém chính xác hơn" (đã có trong `homework-session.tsx`).

## Điều kiện xem xét lại

- Model 27B đo trên bộ mẫu không đạt 18/21, hoặc thời gian chấm trên 10 phút/bài: dừng, không làm tiếp.
- Mở app ra ngoài nhóm gia đình: phải có thoả thuận xử lý dữ liệu và chính sách riêng tư mới; khi đó cân nhắc bỏ LM Studio.
- Supabase hoặc Cloudflare đổi giới hạn thời gian (tra lại 2 trang nguồn ở trên).
- Có máy chủ riêng chạy 24/7 thay cho máy Mac cá nhân.

## Nguồn tham khảo (tra ngày 14/11/2026)

- Supabase Edge Functions limits: https://supabase.com/docs/guides/functions/limits
- Supabase Background Tasks: https://supabase.com/docs/guides/functions/background-tasks
- Supabase Queues, đọc hàng đợi bằng Edge Function: https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions
- Cloudflare Error 524 (Proxy Read Timeout): https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/
- Cloudflare Access service tokens: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
- Cloudflare Zero Trust plans: https://www.cloudflare.com/plans/sase-zero-trust/
- Tailscale Funnel: https://tailscale.com/kb/1223/tailscale-funnel · Pricing FAQ: https://tailscale.com/pricing/faq
- ngrok Free plan limits: https://ngrok.com/docs/pricing-limits/free-plan-limits
- LM Studio Authentication: https://lmstudio.ai/docs/developer/core/authentication
- Số đo nội bộ: ADR-003, `docs/gemini.md`, comment GIA-54, GIA-55
