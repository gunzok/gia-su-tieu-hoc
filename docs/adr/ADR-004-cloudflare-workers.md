# ADR-004: Web tĩnh trên Cloudflare Workers

- **Trạng thái**: Đã chấp nhận (ghi hồi tố 2026-11-13)
- **Ngày**: 2026-11-10 (GIA-65, PR #17, #20)
- **Người quyết định**: chủ dự án

## Bối cảnh
Bản web xuất tĩnh (`web.output = "single"`), cần HTTPS (camera, micro, đăng nhập Google), deploy tự động từ `main`, chi phí thấp.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Cloudflare (Workers file tĩnh) | Miễn phí, HTTPS sẵn, rollback một lệnh, deploy bằng `wrangler` | wrangler 4.x không còn tạo Pages kiểu cũ |
| Hostinger (Apache) | Chủ dự án quen | Tải lên tay/FTP, khó tự động |
| Vercel Hobby | Dễ | Gói Hobby chỉ cho dùng phi thương mại |

## Quyết định
Worker `gia-su-tieu-hoc` (`wrangler.jsonc`, chế độ SPA), deploy bằng workflow `CD - Web (Cloudflare)` qua environment
`web-production` **có người duyệt** (từ 13/11). `.htaccess` giữ làm phương án dự phòng cho Hostinger.

## Hệ quả
- Dễ hơn: gộp + duyệt là lên; quay lại bản cũ bằng `wrangler rollback`.
- Khó hơn: token Cloudflare hết hạn sau 1 năm, phải tạo lại.

## Điều kiện xem xét lại
Khi cần tên miền riêng có email, hoặc web cần máy chủ (SSR, API route).

## Nguồn tham khảo
- `docs/trien-khai-web.md`
