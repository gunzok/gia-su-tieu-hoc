# Bản web (webapp)

Giao diện web làm theo bộ thiết kế "Web App … Đa thiết bị & Màn hình gập" trong Stitch (dự án "AI Gia Sư Tiểu Học"),
dùng đúng tính năng app đã có. Ba cỡ màn hình (`src/web/use-layout.ts`):

| Cỡ | Rộng | Điều hướng | Bố cục |
|---|---|---|---|
| wide (máy tính) | ≥ 1100px | thanh bên có chữ + thẻ sao/chuỗi, thanh trên có huy hiệu lớp | nhiều cột |
| medium (máy gập mở ra, tablet) | 700–1099px | thanh icon bên trái | Chữa bài chia 2 khung 50:50, màn khác xếp dọc |
| narrow (điện thoại) | < 700px | thanh tab dưới | 1 cột |

Chữa bài có dải chọn Câu 1…N (tự mở câu sai đầu tiên): bên trái chi tiết câu, bên phải giọng cô.

## Chạy thử

```bash
npx expo start --web --port 8090
```

## Tách riêng khỏi app mobile

Code web và app nằm chung nhánh `main` (GIA-59). Việc web làm trên nhánh `web/GIA-xx` trong một `git worktree` riêng, để phiên làm app mobile
và phiên làm web không giẫm lên nhau.

- **Giao diện web nằm riêng**: thư mục `src/web/` và các file route đuôi `.web.tsx` trong `src/app/`
  (`(tabs)/_layout.web.tsx`, `(tabs)/index.web.tsx`, `quet-bai.web.tsx`, `chua-bai.web.tsx`, `tien-do.web.tsx`, `goi-plus.web.tsx`).
  Các file này chỉ có trên trình duyệt; app mobile bỏ qua. Không sửa file giao diện mobile (`src/app/(tabs)/*.tsx`, `src/components/*`).
- **Chức năng dùng chung** ở `src/lib/` (chấm bài, lịch sử, hồ sơ, đăng nhập, giọng đọc…): sửa ở đâu thì chỉ đưa qua nhánh kia
  khi chủ dự án duyệt, và giữ thay đổi nhỏ, cộng thêm.
- Thay đổi chức năng riêng cho web: `src/lib/web-alert.ts` (thay `Alert.alert`, vì react-native-web để trống),
  `src/lib/page-images.web.ts` (lưu ảnh bài làm ở trình duyệt), `addPhotos` trong `homework-session.tsx` (nhận ảnh kéo thả),
  hai dòng gắn `WebAlertHost` trong `src/app/_layout.tsx`, và CORS cho hàm `cham-bai`.
- Thành phần nhỏ dùng chung (Card, BigButton, AppText, Mascot, ChoiceChips, GradingOverlay, AccountCard, PrivacyCard…) vẫn lấy
  từ `src/components/`; nếu mobile đổi giao diện các thành phần này thì web đổi theo.

## Chưa có trên web

- Chụp bằng webcam (hiện chọn ảnh từ máy tính hoặc kéo thả).
- Mua gói Plus (RevenueCat chỉ bán trong app điện thoại; web chỉ hướng dẫn).
- Đăng nhập Google: cần thêm địa chỉ web vào danh sách chuyển hướng của Supabase Auth.
- Các màn ngoài 4 tab (Khởi động, Hồ sơ, Đăng nhập, Hỏi cô, Xem bài đã chấm) vẫn dùng giao diện mobile, căn giữa cột 600px.
- Nhiệm vụ hôm nay, đố vui, cửa hàng đổi quà, Tiếng Anh, biểu đồ tuần/tháng: app chưa làm (GIA-37…41) nên web cũng chưa có.

## Mở cho mọi người (công khai, GIA-78)

Từ 14/11/2026 web mở cho mọi người, không cần danh sách mời ([ADR-007](adr/ADR-007-mo-web-cong-khai.md)).
Máy chủ nhận biết bản web qua header `Origin` (trình duyệt tự gắn). Các secret Supabase cho bản web
(đặt bằng `npx supabase secrets set …`, deploy hàm bằng `npx supabase functions deploy <tên>` — chỉ làm khi chủ dự án đồng ý):

| Secret | Ý nghĩa |
|---|---|
| `ALLOWED_ORIGINS` | Địa chỉ web được gọi hàm, cách nhau dấu phẩy (vd `https://gia-su.example.com`). Chưa đặt = cho mọi nguồn. **Phải đặt.** |
| `WEB_CHI_NGUOI_DUOC_MOI` | `false` hoặc không đặt = ai cũng dùng được web (hiện tại). `true` = chỉ người đăng nhập thật có email trong bảng `moi_dung_thu` (bật lại khi bị lạm dụng). |
| `GIOI_HAN_CHUNG_NGAY` | Tổng lượt chấm toàn hệ thống mỗi ngày mà bản web còn nhận (mặc định 300). Cầu dao chống chi phí vượt tầm. |

Giới hạn mỗi ngày (giờ Việt Nam): chấm bài 3 lượt (Miễn phí) / 50 (Plus); Hỏi cô 10 / 100; giọng đọc mới 30 / 200.
Người dùng web chưa có Plus chỉ dùng AI miễn phí (Gemini), không bao giờ rơi sang Claude.
CAPTCHA Supabase **chưa bật** (bật lên là app điện thoại gãy, xem ADR-007); Supabase Auth giới hạn 30 lần đăng nhập ẩn danh/giờ/IP.

Muốn quay về chế độ chỉ người được mời: đặt `WEB_CHI_NGUOI_DUOC_MOI=true`, rồi thêm/bớt người (Supabase → SQL Editor, email chữ thường):

```sql
insert into public.moi_dung_thu (email, ghi_chu) values ('ba.me@gmail.com', 'nhà bạn A');
delete from public.moi_dung_thu where email = 'ba.me@gmail.com';
```

Máy tìm kiếm: `public/robots.txt` cho phép thu thập, `public/_headers` không gắn `X-Robots-Tag: noindex`. Tiêu đề và mô tả trang
đặt bằng `head` của `OnboardingFrame` (`src/web/onboarding-frame.tsx`, dùng `expo-router/head`); mô tả mặc định trong
`index.html` lấy từ `web.description` của `app.json`.

Build để đưa lên hosting: `npm run build:web` (xuất tĩnh, xoá địa chỉ LM Studio khỏi bản build). Kiểm tra `dist/` không chứa khoá bí mật.
Deploy tự động lên Cloudflare (Workers, file tĩnh), quay lại bản cũ, Sentry và cảnh báo chi phí: xem `docs/trien-khai-web.md`.
