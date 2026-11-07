# Việc còn lại so với thiết kế Stitch

Cập nhật 03/11/2026. Việc chưa làm được quản lý trên **Linear** (team `GIA`, project
"Gia sư Tiểu học — Ra mắt bản đầu"); file này chỉ để nhìn nhanh, chi tiết xem ở ticket.

Giao diện theo bộ thiết kế "Cô Giáo Nhí (Flat Pastel)" (Stitch "AI Gia Sư Tiểu Học").

## Đã xong
- [x] Tên, lớp và ảnh đại diện của bé — màn Hồ sơ (18/10/2026; ảnh đại diện tạm dùng emoji)
- [x] Đăng nhập Ba Mẹ bằng email (mã 6 số) và Google qua Supabase (Google: GSTH-012, bản 0.3.0)
- [x] Chụp / chọn nhiều trang (tối đa 6) và chấm một lần; lưu ảnh + bài chấm theo bé, tra cứu theo môn (18/10/2026)
- [x] Hỏi cô ở từng câu trong bài đã chấm (18/10/2026); nói câu hỏi bằng micro (GSTH-036, bản 0.4.0)
- [x] Màn Chữa bài: nút "Thử lại câu này" (GSTH-021, bản 0.3.0)
- [x] Sao thưởng (⭐, +15 sao sau mỗi bài) và chuỗi ngày học liên tiếp (🔥) (GSTH-019, bản 0.3.0)
- [x] Thanh toán RevenueCat: SDK, Paywall, Customer Center đã nối (18/10/2026)

## Còn lại (trên Linear)
| Việc | Ticket |
|---|---|
| Cấu hình RevenueCat dashboard + build riêng để mua thật | GIA-25 (GSTH-009) |
| Đăng nhập Apple | GIA-28 |
| Đăng nhập số điện thoại (SMS), mã trường | GIA-42 |
| Nhiệm vụ hôm nay (3 bài Toán, đọc 1 bài, chữa bài…) | GIA-37 |
| Màn Tiến độ: Tuần / Tháng / Học kỳ, mục tiêu, phiếu bài PDF, lời động viên | GIA-38 |
| Đố vui có thưởng ở Trang chủ | GIA-39 |
| Cửa hàng đổi quà bằng sao | GIA-40 |
| Môn Tiếng Anh | GIA-41 |

Nhóm tính năng vui sau ra mắt: ticket cha GIA-36.

## Cần quyết định
- [x] Tên app: "Gia sư Tiểu học"; gia sư là Cô giáo (mặc định) hoặc Thầy giáo (gói Plus) — 18/10/2026
- [ ] Có cần chế độ tối không (hiện đã tắt) — GIA-43
