# Kiểm thử bản web và chạy thử với 10 người (GIA-73)

## 1. Bảng kiểm thử theo trình duyệt (QA điền)

Mỗi ô ghi ✅ / ❌ kèm ghi chú. Thử ở 3 cỡ: máy tính (≥1100px), máy gập/tablet (700–1099px), điện thoại (<700px).

| Việc cần thử | Chrome | Safari (Mac) | Firefox | iPhone Safari | Android Chrome | Máy gập |
|---|---|---|---|---|---|---|
| Hộp đồng ý hiện ở lần đầu, bấm xong không hiện lại | | | | | | |
| Đăng nhập email (mã 6 số) | | | | | | |
| Đăng nhập Google, tải lại vẫn còn phiên | | | | | | |
| Tạo hồ sơ bé, vào Trang chủ | | | | | | |
| Quét bài: kéo thả ảnh (máy tính) / chọn ảnh | | | | | | |
| Quét bài: bấm "chụp" mở hộp chọn ảnh/camera | | | | | | |
| Chấm bài 1 trang, nhiều trang | | | | | | |
| Chữa bài: chọn câu, Thử lại, Hỏi cô | | | | | | |
| Nghe cô đọc nhận xét (giọng AI hoặc giọng máy) | | | | | | |
| Tiến độ, lịch sử | | | | | | |
| Hết lượt chấm: có lời báo thân thiện, số lượt còn lại đúng | | | | | | |
| Trang Chính sách, Điều khoản mở được | | | | | | |
| Đăng xuất, xoá tài khoản | | | | | | |

## 2. Kiểm tra truy cập (accessibility)

- Dùng bàn phím: Tab đi qua mọi nút theo thứ tự hợp lý, Enter/Space bấm được, thấy rõ ô đang chọn.
- Tương phản chữ/nền đủ (chữ nhỏ màu xám trên nền kem, thẻ màu nhạt).
- Vùng bấm ≥ 44px (nút "Xem trang", dải chọn câu, link ở chân trang).
- Mọi ảnh/nút chỉ có icon có `accessibilityLabel`.
- Phóng to chữ 200%: không vỡ bố cục.

## 3. Trước khi mời 10 người (DevOps làm, cần chủ dự án đồng ý)

1. Deploy 4 hàm + chạy 2 migration (`luot_ai_ngay`, `moi_dung_thu`).
2. Đặt secret: `ALLOWED_ORIGINS`, `WEB_CHI_NGUOI_DUOC_MOI=true`, `GIOI_HAN_CHUNG_NGAY` (xem `docs/webapp.md`).
3. Thêm 10 email vào bảng `moi_dung_thu`.
4. Thêm địa chỉ web vào Redirect URLs của Supabase Auth và Authorized JavaScript origins của Google OAuth.
5. Đặt `LEGAL_DRAFT = false` sau khi chủ dự án duyệt hai trang pháp lý.
6. `npm run build:web`, kiểm tra `dist/` không có khoá bí mật, đưa lên hosting (GIA-65).

## 4. Hướng dẫn 1 trang cho người dùng thử (gửi kèm lời mời)

- Mở link, bấm "Tôi đồng ý", đăng nhập bằng email (nhận mã 6 số) hoặc Google bằng đúng email đã được mời.
- Tạo hồ sơ cho bé, chọn lớp.
- Vào "Quét bài", kéo thả hoặc chọn ảnh bài làm (tối đa 6 trang). Mỗi ngày có 3 lượt chấm.
- Xem kết quả ở "Chữa bài", bấm "Hỏi cô" nếu bé chưa hiểu.
- Gặp lỗi: chụp màn hình, ghi giờ và việc đang làm, gửi cho nhóm phát triển.

## 5. Mẫu ghi lỗi

| Giờ | Trình duyệt / thiết bị | Màn hình | Việc đang làm | Điều xảy ra | Điều mong đợi | Ảnh chụp |
|---|---|---|---|---|---|---|

## 6. Tiêu chí quyết định mở rộng (sau 1 tuần)

- Không còn lỗi nặng (không đăng nhập được, không chấm được, mất dữ liệu).
- Chi phí AI nằm trong ngưỡng (xem GIA-72).
- Phản hồi của ba mẹ: bé tự dùng được, lời nhận xét dễ hiểu.
