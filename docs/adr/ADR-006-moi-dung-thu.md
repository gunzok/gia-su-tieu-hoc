# ADR-006: Web chỉ cho người được mời, nhận diện bằng `Origin`, giới hạn lượt

- **Trạng thái**: Đã chấp nhận (ghi hồi tố 2026-11-13)
- **Ngày**: 2026-11-07 (GIA-68, 69, 70) · bật trên máy chủ 2026-11-10
- **Người quyết định**: chủ dự án

## Bối cảnh
Web golive cho khoảng 10 người thử trong khi AI miễn phí có giới hạn và rủi ro điều khoản (ADR-003). Đăng nhập ẩn danh phải
giữ cho app mobile.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Danh sách mời + header `Origin` + giới hạn lượt | Không đụng app mobile, bật/tắt bằng secret | `Origin` chỉ đáng tin với trình duyệt |
| Tắt đăng ký trên Supabase | Đơn giản | Gãy app mobile (đăng nhập ẩn danh) |
| Mật khẩu chung cho web | Nhanh | Dễ lộ, không biết ai dùng |

## Quyết định
Secrets `ALLOWED_ORIGINS` (chỉ địa chỉ web), `WEB_CHI_NGUOI_DUOC_MOI=true` (đăng nhập thật + email trong `moi_dung_thu`),
`GIOI_HAN_CHUNG_NGAY=300`; giới hạn mỗi ngày: chấm 3 / Hỏi cô 10 / giọng mới 30 (Plus 50 / 100 / 200). Thêm/bớt người bằng SQL,
hỏi chủ dự án trước khi ghi.

## Hệ quả
- Dễ hơn: kiểm soát chi phí và người dùng trong giai đoạn thử.
- Khó hơn: thêm người phải ghi tay; gửi link cho người chưa mời sẽ không dùng được.

## Điều kiện xem xét lại
Khi mở web công khai: thay bằng CAPTCHA + thanh toán, xử lý ADR-003.

## Nguồn tham khảo
- `docs/webapp.md` (mục Mở cho người dùng thử), `docs/trien-khai-web.md`
