# ADR-007: Mở web công khai, chống lạm dụng đăng ký mà không làm gãy app mobile

- **Trạng thái**: Đề xuất (chờ chủ dự án duyệt qua PR GIA-78)
- **Ngày**: 2026-11-14 (GIA-78)
- **Người quyết định**: chủ dự án
- **Thay thế một phần**: [ADR-006](ADR-006-moi-dung-thu.md) (bỏ danh sách mời; giữ nhận diện web bằng `Origin` và giới hạn lượt)

## Bối cảnh
Chủ dự án chốt 14/11/2026: mở https://gia-su-tieu-hoc.giasutieuhoc.workers.dev cho mọi người, bỏ danh sách mời
(`WEB_CHI_NGUOI_DUOC_MOI=true`, bảng `moi_dung_thu`). Khi ai cũng vào được, cần chặn người/robot tạo hàng loạt tài khoản để
dùng chùa AI chấm bài.

Ràng buộc:
- App mobile gọi `supabase.auth.signInAnonymously()` (`src/lib/supabase.ts`, `ensureSession`) ngay khi mở, và sắp phát APK cho
  người dùng. Các bản đã cài **không gửi mã CAPTCHA**.
- CAPTCHA của Supabase Auth là cài đặt **cho cả dự án**: bật lên thì mọi lời gọi đăng ký/đăng nhập (ẩn danh, gửi mã email…)
  thiếu `captchaToken` đều bị từ chối, không phân biệt web hay app. Bật mà app chưa gửi token = app không tạo được phiên,
  không chấm được bài.
- Máy chủ đã có: giới hạn lượt theo người (chấm 3/ngày, Hỏi cô 10, giọng mới 30; Plus 50/100/200), cầu dao tổng
  `GIOI_HAN_CHUNG_NGAY` (mặc định 300 lượt chấm/ngày cho bản web), web chưa Plus chỉ dùng AI miễn phí (Gemini), CORS theo
  `ALLOWED_ORIGINS`. Supabase Auth có giới hạn tốc độ riêng: đăng nhập ẩn danh mặc định 30 lần/giờ/IP; gửi email theo
  Auth → Rate Limits.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| **(a) Bật CAPTCHA Supabase (Cloudflare Turnstile) cho web và app** | Chặn robot ngay ở cửa đăng ký; Turnstile miễn phí (tới 20 widget/tài khoản) | Turnstile **không có SDK di động chính thức**: app phải nhúng trang Turnstile qua `react-native-webview` (chưa có trong dự án, là mã native → cần build EAS mới, không đi OTA được) và một trang trung gian trên tên miền được phép. Mọi APK/bản cài cũ gãy ngay khi bật. Thêm một bước chờ trước khi bé dùng được app |
| **(a') Turnstile chỉ trên web, kiểm token trong hàm Edge** | Không đụng app | Không chặn được tạo tài khoản ở Supabase Auth (robot gọi thẳng API Auth bằng khoá publishable công khai). Phải sửa `supabase/functions/**` |
| **(b) Giữ CAPTCHA tắt; dựa vào giới hạn tốc độ Auth + giới hạn lượt theo người + cầu dao tổng** | Không đổi gì ở app, không tốn tiền, làm được ngay; chi phí AI của web bị chặn trên bởi `GIOI_HAN_CHUNG_NGAY` và chỉ dùng Gemini | Robot vẫn tạo được tài khoản ẩn danh (30/giờ/IP); mỗi tài khoản có 3 lượt chấm/ngày. Cầu dao tổng chỉ áp cho yêu cầu có `Origin` (xem Rủi ro còn lại) |
| (c) Web bắt buộc đăng nhập thật (email/Google) nhưng không cần trong danh sách mời | Đắt hơn cho robot (cần email nhận mã); không đụng app | Cần sửa luật `inviteDecision` ở `supabase/functions/_shared` (ngoài phạm vi GIA-78); thêm ma sát cho phụ huynh mới |

Tra cứu ngày 14/11/2026:
- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits (ẩn danh mặc định 30 yêu cầu/giờ/IP).
- Supabase Auth CAPTCHA: https://supabase.com/docs/guides/auth/auth-captcha (token gửi qua `options.captchaToken`).
- Turnstile plans: https://developers.cloudflare.com/turnstile/plans (gói Free: miễn phí, tới 20 widget).
- Turnstile trên React Native chỉ qua WebView, cần trang trung gian vì cookie: https://www.npmjs.com/package/react-native-turnstile ,
  https://dev.to/ryabinin/protect-your-react-native-application-using-cloudflare-turnstile-4l4l

## Quyết định
Chọn **(b) ngay bây giờ**, lên lộ trình **(a) khi app có bản build mới**:

1. GIA-78 (ngay): CAPTCHA Supabase **giữ tắt**. Đặt `WEB_CHI_NGUOI_DUOC_MOI=false` (hoặc xoá). Giữ `ALLOWED_ORIGINS`,
   `GIOI_HAN_CHUNG_NGAY=300`, giới hạn lượt theo người, Gemini-only cho web chưa Plus. Giữ giới hạn ẩn danh mặc định
   30/giờ/IP (không hạ thấp: người dùng 4G ở Việt Nam hay chung IP qua CGNAT). Bật cảnh báo ngân sách AI (GIA-72).
2. Sau đó (ticket riêng, cần build EAS mới): thêm Turnstile cho web (`signInWithOtp`, `signInAnonymously`) và app
   (WebView + trang trung gian trên tên miền web), phát bản build có Turnstile, đợi đa số máy cập nhật, **rồi mới** bật
   CAPTCHA trong Supabase. Bật sớm hơn là gãy app.

## Vì sao app mobile hiện tại vẫn đăng nhập được
- GIA-78 không sửa `src/lib/auth.tsx`, `src/lib/supabase.ts` hay cài đặt Supabase Auth: `signInAnonymously()` gọi y như cũ.
- CAPTCHA vẫn tắt nên Supabase không đòi `captchaToken`.
- `WEB_CHI_NGUOI_DUOC_MOI` chỉ áp khi yêu cầu có header `Origin` (`inviteDecision` trả `null` khi `!browser`, có test
  `src/lib/__tests__/gioi-han.test.ts`). App không gửi `Origin` nên đặt `false` không đổi gì cho app.
- Thay đổi code của GIA-78 chỉ nằm ở `src/web/**` (chỉ chạy trên trình duyệt) và `public/` (file tĩnh của web).

## Hệ quả
- Dễ hơn: ai có link cũng dùng được web; không phải ghi tay danh sách mời; máy tìm kiếm thấy trang.
- Khó hơn: số tài khoản ẩn danh tăng; cần theo dõi chi phí và số lượt hằng ngày (Sentry, budget alert).
- Bảng `moi_dung_thu` và code danh sách mời giữ nguyên để bật lại nhanh khi bị lạm dụng (`WEB_CHI_NGUOI_DUOC_MOI=true`).

## Rủi ro còn lại (đề xuất ticket riêng, sửa `supabase/functions/**`)
- **Bỏ qua nhận diện web bằng cách không gửi `Origin`.** `Origin` đáng tin với trình duyệt, nhưng script tự viết gọi thẳng hàm
  Edge (khoá publishable nằm công khai trong bản web) mà không gửi `Origin` sẽ được coi như app: không bị cầu dao tổng
  `GIOI_HAN_CHUNG_NGAY`, và có thể rơi sang Claude (trả phí) khi Gemini lỗi. Rủi ro này **đã có từ trước** (đăng nhập ẩn danh đã
  mở cho app), mở web làm link dễ tìm hơn. Đề xuất: áp cầu dao tổng cho mọi yêu cầu (không chỉ web) và chỉ cho Claude với
  người có Plus hoặc tài khoản không ẩn danh; thêm cảnh báo ngân sách Anthropic.
- Robot tạo nhiều tài khoản ẩn danh để lấy 3 lượt/ngày mỗi tài khoản: bị chặn trên bởi 30 tài khoản/giờ/IP và cầu dao tổng
  (với yêu cầu web).

## Điều kiện xem xét lại
- Số tài khoản ẩn danh mới/ngày tăng bất thường, hoặc cầu dao tổng chạm trần nhiều ngày liền → bật lại danh sách mời hoặc
  làm phương án (c).
- App có bản build gửi Turnstile và đa số máy đã cập nhật → làm phương án (a).
- Chuyển AI trả phí cho người dùng miễn phí (ADR-003, R-001) → bắt buộc có CAPTCHA hoặc (c) trước.

## Nguồn tham khảo
- ADR-003, ADR-006; `docs/webapp.md`; `docs/trien-khai-web.md`; `supabase/functions/_shared/gioi-han.ts`, `moi.ts`.
