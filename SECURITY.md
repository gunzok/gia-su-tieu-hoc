# Chính sách bảo mật

App có dữ liệu của trẻ em (ảnh bài làm, hồ sơ bé), nên mọi lỗ hổng đều được xử lý ưu tiên.

## Báo cáo lỗ hổng
Không mở issue công khai. Dùng **Report a vulnerability** ở tab Security của repo
(https://github.com/gunzok/gia-su-tieu-hoc/security/advisories/new), ghi mô tả, cách tái hiện và mức ảnh hưởng.

## Xử lý
- Xác nhận đã nhận trong 3 ngày làm việc.
- Đánh giá mức nghiêm trọng, vá, phát hành (OTA / web / Supabase), ghi vào `CHANGELOG.md` (mục Sửa) khi đã an toàn.
- Lộ khoá bí mật: thu hồi khoá ngay ở nơi cấp (Supabase, Google, Anthropic, Cloudflare, Expo), rồi mới sửa code.

## Phạm vi
App iOS/Android, web (https://gia-su-tieu-hoc.giasutieuhoc.workers.dev), các hàm Edge và database Supabase của dự án.
