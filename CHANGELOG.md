# Nhật ký thay đổi

Ghi những gì ba mẹ và bé thấy khác đi ở mỗi bản. Cách ghi và cách phát hành: xem mục "Phát hành"
trong `.claude/skills/eas-release/SKILL.md`.

Mỗi bản có một tag Git `vX.Y.Z`. Mã ticket: `GSTH-xxx` (bảng cũ) hoặc `GIA-xx` (Linear).

## [Chưa phát hành]

### Thêm
- Chấm bài và Hỏi cô bằng Gemini (gói miễn phí, bản thử); Claude làm dự phòng. Thứ tự đổi được trên máy chủ
  bằng secret `AI_THU_TU`. Cần đặt khoá `GEMINI_API_KEY` và deploy lại hàm (GSTH-039 / GIA-19).
- Lời dặn chấm riêng cho từng dạng bài: nối, tô màu, bảng, khoanh, vẽ hình, chữ viết tay (GSTH-038).

### Bỏ
- App không còn tự gọi LM Studio ở máy tính trong nhà (GSTH-039).

### Nội bộ
- Việc chuyển từ bảng Kanban sang Linear; `package.json` dùng cùng version với `app.json` (GIA-35).
- GitHub Actions chạy lint, typecheck và test mỗi lần đẩy code (GIA-29).

## [0.4.0] - 2026-10-20

Bản build mới (có thư viện mã gốc), máy đang cài 0.3.0 phải cài lại.

### Thêm
- Nút micro ở Hỏi cô: bé nói câu hỏi, app đổi thành chữ trong ô nhập (GSTH-036).
- Máy không nghe được tiếng Việt thì báo nhẹ nhàng và ẩn nút micro.

### Sửa
- Ảnh bài cũ hiện lại được sau khi cài bản mới (GSTH-037).
- Micro không lấy được tiếng thì báo "Cô chưa nghe được tiếng từ micro" thay vì "Micro đang bận".

### Khác
- Chính sách quyền riêng tư ghi rõ việc nhận giọng nói do Apple/Google xử lý.

## [0.3.0] - 2026-10-20

### Thêm
- Sao thưởng (+15 ⭐ sau mỗi bài) và chuỗi ngày học liên tiếp (🔥), lưu theo từng bé (GSTH-019).
- Nút "Thử lại câu này" ở câu sai: bé làm lại, cô báo đúng/sai và đọc to (GSTH-021).
- Đăng nhập Ba Mẹ bằng Google (GSTH-012).
- Giọng ElevenLabs dự phòng khi giọng Google lỗi hoặc hết mức tháng (GSTH-034).
- Nhận biết lớp của bài và ảnh không phải bài tập.
- Giới hạn lượt chấm: Miễn phí 3 bài/ngày, Plus 50 bài/ngày; chưa chấm được thì trả lại lượt (GSTH-004).
- Cổng phụ huynh trước màn mua gói Plus.
- Trang Chính sách quyền riêng tư và nút Xoá tài khoản & dữ liệu.

### Sửa
- Hỏi cô: Enter để gửi câu hỏi; chạy được trên bản web.
- Lời nhắn thân thiện khi hết lượt hoặc mất mạng.

### Bảo mật
- Rà lại quyền truy cập dữ liệu (RLS): mỗi phụ huynh chỉ thấy bài và ảnh của bé nhà mình.

## [0.2.0] - 2026-10-18

### Thêm
- Giọng đọc AI Google (Chirp 3 HD) cho cô và thầy; hết phần miễn phí tháng thì tự về giọng trên máy.
- Hỏi cô ở từng câu trong bài đã chấm.
- Nút loa nghe giảng từng câu; nút loa chuyển động khi đang đọc; lời chào đổi mỗi lần mở app.
- Bản iOS cho máy giả lập (`npm run build:ios-sim`).

### Sửa
- Lời cô tự nhiên hơn, giống giáo viên nói chuyện với bé.

## [0.1.0] - 2026-10-18

Bản đầu tiên.

- Chụp hoặc chọn nhiều trang (tối đa 6), AI chấm một lần, cô nhận xét và đọc thành tiếng.
- Giao diện "Cô Giáo Nhí": màn Khởi động, Đăng nhập Ba Mẹ (email mã 6 số), Hồ sơ của bé.
- Lưu ảnh và bài chấm theo từng bé, xem lại theo môn.
- Gói Gia sư Tiểu học Plus (tháng / năm / trọn đời) qua RevenueCat; chọn Thầy hoặc Cô.
- Cập nhật qua mạng (EAS Update).
