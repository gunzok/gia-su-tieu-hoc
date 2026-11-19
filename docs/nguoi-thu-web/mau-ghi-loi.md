# Mẫu ghi lỗi (người dùng thử)

Mỗi lỗi một dòng. Không biết ô nào thì để trống. Ảnh chụp màn hình gửi kèm, đặt tên theo số thứ tự (1.png, 2.png…).

| # | Ngày giờ | Máy + trình duyệt | Màn hình (Trang chủ / Quét bài / Chữa bài / Tiến độ / Đăng nhập / khác) | Đang làm gì | Điều xảy ra | Mong đợi | Mức (Nặng / Vừa / Nhẹ) | Ảnh |
|---|---|---|---|---|---|---|---|---|
| 1 | 20/11 19:30 | iPhone 13, Safari | Quét bài | Chọn 2 ảnh rồi bấm Chấm | Quay mãi không xong | Có kết quả trong 1 phút | Nặng | 1.png |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

**Mức độ:**
- **Nặng**: không dùng tiếp được (không đăng nhập, không chấm, mất bài, hiện thông tin của người khác).
- **Vừa**: làm được nhưng sai hoặc rất khó (chấm sai, nút không bấm được, chữ bị che).
- **Nhẹ**: chữ sai chính tả, lệch màu, chậm một chút.

## Cho nhóm phát triển (QA tổng hợp)
Mỗi lỗi Nặng/Vừa tạo một ticket con của GIA-73 trên Linear (project Web app, nhãn `Bug` + `Web`),
ghi cách tái hiện, máy/trình duyệt, mức độ, ảnh; dán mã ticket lại vào cột "#" của bảng này.
