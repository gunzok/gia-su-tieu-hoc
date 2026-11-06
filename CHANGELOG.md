# Nhật ký thay đổi

Ghi những gì ba mẹ và bé thấy khác đi ở mỗi bản. Cách ghi và cách phát hành: xem mục "Phát hành"
trong `.claude/skills/eas-release/SKILL.md`.

Mỗi bản có một tag Git `vX.Y.Z`. Mã ticket: `GSTH-xxx` (bảng cũ) hoặc `GIA-xx` (Linear).

## [Chưa phát hành]

Dự kiến là bản 0.5.0. Cần cài bản build mới mới có trình quét trang và đọc chữ; máy đang cài 0.4.0 nhận
cập nhật OTA vẫn chạy, chỉ không có hai phần đó. Cách thử từng mục: [docs/kiem-thu-0.5.0.md](docs/kiem-thu-0.5.0.md).

### Thêm
- Nút Chụp mở trình quét trang: tự tìm mép giấy, cắt phần thừa, làm thẳng trang (GIA-47).
- Ảnh mờ, tối hoặc lóa đèn được nhắc chụp lại ngay, không mất lượt. Ba mẹ vẫn chọn "Vẫn dùng ảnh này" được (GIA-48).
- Môn Toán: máy đọc đề và tự tính đáp án các phép tính một dòng, gửi kèm cho cô để cô đỡ tính nhầm (GIA-53).
- Chấm bài và Hỏi cô bằng Gemini (gói miễn phí, bản thử); Claude làm dự phòng (GSTH-039 / GIA-19).
- Lời dặn chấm riêng cho từng dạng bài: nối, tô màu, bảng, khoanh, vẽ hình, chữ viết tay (GSTH-038).

### Sửa
- Bài nhiều trang không còn bị sót trang: mỗi trang được chấm riêng rồi gộp lại, trang không có bài nào được chấm lại một lần (GIA-49).
- Chụp trùng một trang không còn bị tính điểm hai lần; chọn lại ảnh đã có trong album thì app bỏ qua và báo (GIA-50).
- Vẫn nhận ra trang chụp trùng khi AI gộp hoặc tách câu khác nhau giữa hai ảnh (GIA-57).
- Bài văn sai vài lỗi nhỏ không còn bị 0 điểm: mỗi loại lỗi trừ 1 điểm, chỉ gạch đúng chữ sai. Bài viết tính cả lỗi viết hoa và dấu câu (GIA-66).
- Cô đọc đồng hồ đúng hơn và chép đúng chữ bé viết, không tự sửa chữ sai của bé (GIA-66).
- Ảnh gửi chấm nét hơn để đọc chữ số viết tay rõ hơn (GIA-52).
- Máy chủ không chấm được (AI quá chậm, hết tiền, mất mạng) thì app lại tự chấm bằng LM Studio ở máy tính
  trong nhà như trước, cả bài lẫn Hỏi cô (GIA-54).
- Bài nhiều phần tính điểm theo từng phần: sai 2 trong 8 phép không còn bị tính sai cả bài; "Con viết" chỉ gạch phần sai (GIA-55).
- Lời báo khi chưa chấm được nói đúng nguyên nhân, chỉ bảo kiểm tra mạng khi thật sự mất mạng (GIA-55).
- Gemini quá tải tạm thời thì thử lại trước khi chuyển AI khác (GIA-55).
- LM Studio chấm được bài nhiều trang, đỡ chờ thêm bước nhận biết lớp, đọc được kết quả của model có suy luận (GIA-54, GIA-55).
- Nút mua và khôi phục gói Plus đi qua cổng phụ huynh; lời báo thanh toán không còn chữ kỹ thuật (GSTH-040 / GIA-22).

### Nội bộ
- Việc chuyển từ bảng Kanban sang Linear; `package.json` dùng cùng version với `app.json` (GIA-35).
- GitHub Actions chạy lint, typecheck và test mỗi lần đẩy code (GIA-29).
- Có thêm 2 thư viện mã gốc (`react-native-document-scanner-plugin`, `expo-text-extractor`) và `jpeg-js`.

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
