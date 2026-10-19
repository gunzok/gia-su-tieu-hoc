# GSTH-5I7 — S3: Xem nhận xét từng buổi học

| Mục | Giá trị |
|---|---|
| Ticket | GSTH-5I7 (Story), thuộc Epic GSTH-002 Cổng thông tin phụ huynh |
| Story trong epic | S3 · MoSCoW: **Must** · Ước lượng 2–3 ngày |
| Phụ thuộc | S1 (GSTH-504: đăng nhập, liên kết con, kiểm tra quyền phụ huynh–học sinh, "con đang chọn"); D1 (gia sư/admin nhập dữ liệu buổi học) |
| Vai trò viết | BA Agent |
| Skill áp dụng | `write-spec` (.claude/skills/write-spec) |
| Nguồn | Mô tả ticket; PRD `docs/product/GSTH-002-cong-thong-tin-phu-huynh.md` (nhánh `agent/gsth-002`); spec S1 `docs/specs/GSTH-504-dang-nhap-lien-ket-con.md` (nhánh `agent/gsth-504`). Cả hai đều chưa merge |
| Trạng thái | Sẵn sàng cho TechLead/Dev, sau khi S1 xong |

## 1. Bối cảnh & giả định

Repo `main` chưa có mã ứng dụng. Theo PRD (A2), dữ liệu buổi học do gia sư/admin nhập ở phía quản trị (epic khác). Cổng phụ huynh **chỉ đọc**.

| # | Giả định | Nếu sai thì |
|---|---|---|
| A1 | Mỗi **buổi học** có các trường do gia sư nhập cho **từng học sinh**: điểm danh, nội dung đã học, nhận xét, bài tập về nhà. Lớp nhóm vẫn có nhận xét riêng cho từng học sinh. | Nếu nhận xét chung cho cả lớp → AC14 cần xem lại |
| A2 | Giá trị điểm danh: **Có mặt**, **Đi muộn**, **Vắng có phép**, **Vắng không phép**, **Chưa điểm danh**. | Đổi danh sách nhãn, logic giữ nguyên |
| A3 | Danh sách S3 chỉ gồm các buổi **đã diễn ra** (giờ kết thúc ≤ thời điểm hiện tại theo Asia/Ho_Chi_Minh) và **không bị huỷ**. Buổi sắp tới và buổi bị huỷ/dời thuộc S2. | Nếu muốn thấy buổi huỷ trong lịch sử → thêm trạng thái hiển thị |
| A4 | "Buổi chưa có nhận xét" = trường **nhận xét** trống (sau khi bỏ khoảng trắng). Các trường khác trống thì hiển thị nhãn riêng (xem AC6, AC7). | — |
| A5 | Nội dung do gia sư nhập là **văn bản thuần** (giữ xuống dòng). Không có định dạng rich text, ảnh hay file đính kèm ở v1. | Thêm story cho đính kèm |
| A6 | Phụ huynh thấy **bản mới nhất** khi gia sư sửa nhận xét. Không hiển thị lịch sử chỉnh sửa. | — |
| A7 | Hiển thị **10 buổi** mỗi lần, có nút "Xem thêm" để tải buổi cũ hơn. Không giới hạn khoảng thời gian lịch sử. | TechLead chỉnh số lượng |
| A8 | Mobile-first, tiếng Việt, ngày giờ theo Asia/Ho_Chi_Minh, định dạng `Thứ X, dd/mm/yyyy · HH:mm–HH:mm`. | — |

## 2. Problem statement

Phụ huynh bận đi làm, không biết hôm nay con có đi học không, học được gì và cần ôn gì ở nhà. Thông tin này hiện chỉ đến qua tin nhắn Zalo rời rạc của gia sư (nếu có), khó tra lại. Không giải quyết thì phụ huynh không hỗ trợ con được ở nhà, hỏi gia sư nhiều lần, và mất niềm tin vào chất lượng dạy (PRD Problem Statement, G5).

## 3. Goals / Non-goals

**Goals**
- G1: Phụ huynh biết trạng thái buổi gần nhất của con (đi học hay không, học gì, bài tập) chỉ với **1 màn hình**, không cần hỏi gia sư.
- G2: Đóng góp vào PRD G5: ≥ 80% buổi học có nhận xét hiển thị cho phụ huynh trong 30 ngày. S3 cung cấp dữ liệu để đo.
- G3: Không lộ nhận xét của học sinh khác, kể cả trong lớp nhóm.

**Non-goals / Out of scope**

| Hạng mục | Lý do |
|---|---|
| Gia sư/admin nhập, sửa nhận xét và điểm danh | Phía quản trị (D1) |
| Phụ huynh trả lời, bình luận, "đã đọc", thả cảm xúc với nhận xét | Tương tác hai chiều, PRD Non-goals (không chat) |
| Ảnh, file đính kèm, ghi âm trong nhận xét hoặc bài tập | A5, để story sau |
| Phụ huynh đánh dấu bài tập "đã làm" | Story sau |
| Biểu đồ tiến độ, thống kê số buổi vắng, điểm số theo môn | S8 |
| Thông báo khi có nhận xét mới | Chưa có trong epic (S6/S7 chỉ về lịch và học phí). Đề xuất Next |
| Lọc theo môn/khoảng ngày, tìm kiếm trong nhận xét | P1/P2 |
| Buổi sắp tới, buổi bị huỷ/dời | S2 |
| Xuất PDF/in báo cáo | P2 |
| Đăng nhập, chọn con, kiểm tra quyền | Đã có ở S1, S3 chỉ tái sử dụng |

## 4. User stories

- **US1**: As a phụ huynh đã đăng nhập, I want xem danh sách các buổi học đã diễn ra của con, buổi mới nhất ở trên cùng so that tôi biết ngay tình hình gần đây nhất.
- **US2**: As a phụ huynh, I want biết con có mặt hay vắng ở từng buổi so that tôi phát hiện sớm việc con nghỉ học.
- **US3**: As a phụ huynh, I want đọc nội dung đã học và nhận xét của gia sư so that tôi hiểu con tiến bộ thế nào và cần chú ý gì.
- **US4**: As a phụ huynh, I want thấy bài tập về nhà của từng buổi so that tôi nhắc và hỗ trợ con làm bài.
- **US5**: As a phụ huynh có nhiều con, I want xem nhận xét theo từng con so that thông tin không bị lẫn giữa các con.

## 5. Acceptance criteria

**Danh sách & thứ tự (US1)**
AC1: Given phụ huynh đã đăng nhập và đang chọn con X (theo S1), When mở màn "Nhận xét buổi học", Then thấy danh sách các buổi **đã diễn ra, không bị huỷ** của X, sắp xếp theo thời gian bắt đầu **giảm dần** (mới nhất trên cùng).
AC2: Given X có nhiều hơn 10 buổi đã diễn ra, When mở màn, Then chỉ hiển thị 10 buổi mới nhất kèm nút "Xem thêm". Bấm "Xem thêm" tải tiếp 10 buổi cũ hơn nối vào cuối danh sách, không trùng và không bỏ sót buổi nào. Hết buổi thì ẩn nút.
AC3: Given X chưa có buổi học nào đã diễn ra, When mở màn, Then hiển thị "Chưa có buổi học nào đã diễn ra." thay vì danh sách trống.

**Nội dung từng buổi (US2, US3, US4)**
AC4: Given một buổi đã diễn ra trong danh sách, When phụ huynh xem buổi đó, Then thấy đủ: ngày giờ (`Thứ X, dd/mm/yyyy · HH:mm–HH:mm`, Asia/Ho_Chi_Minh), môn học, tên gia sư, **điểm danh**, **nội dung đã học**, **nhận xét**, **bài tập về nhà**.
AC5: Given buổi có trường nhận xét trống (hoặc chỉ có khoảng trắng), When phụ huynh xem buổi đó, Then vị trí nhận xét hiển thị đúng chữ **"Gia sư chưa cập nhật"** (kiểu chữ phụ, khác với nhận xét thật).
AC6: Given buổi có nội dung đã học trống, When phụ huynh xem, Then vị trí nội dung hiển thị "Gia sư chưa cập nhật".
AC7: Given buổi có bài tập về nhà trống, When phụ huynh xem, Then vị trí bài tập hiển thị "Không có bài tập về nhà" nếu gia sư đã nhập nhận xét (buổi đã cập nhật); hiển thị "Gia sư chưa cập nhật" nếu nhận xét cũng trống.
AC8: Given buổi có điểm danh là một trong các giá trị ở A2, When phụ huynh xem, Then điểm danh hiển thị bằng nhãn chữ tiếng Việt kèm màu/biểu tượng phân biệt; ý nghĩa không chỉ dựa vào màu (đọc được khi không phân biệt màu).
AC9: Given buổi có điểm danh "Vắng có phép" hoặc "Vắng không phép", When phụ huynh xem, Then nhãn vắng hiển thị nổi bật ở đầu thẻ buổi học; nội dung đã học và bài tập vẫn hiển thị nếu gia sư có nhập (để con học bù); nhận xét trống **không** hiển thị "Gia sư chưa cập nhật" mà hiển thị "—".
AC10: Given buổi đã diễn ra nhưng gia sư chưa điểm danh, When phụ huynh xem, Then điểm danh hiển thị "Chưa điểm danh".
AC11: Given nội dung, nhận xét hoặc bài tập có nhiều dòng hoặc rất dài, When hiển thị, Then giữ nguyên xuống dòng do gia sư nhập. Văn bản dài hơn 5 dòng được thu gọn với nút "Xem thêm/Thu gọn" ngay trong thẻ.
AC12: Given gia sư đã sửa nhận xét sau khi phụ huynh xem, When phụ huynh tải lại màn, Then thấy nội dung mới nhất.

**Theo con & phân quyền (US5) — bắt buộc có test tự động**
AC13: Given phụ huynh có ≥ 2 con, When đổi con bằng bộ chọn của S1, Then danh sách chuyển sang buổi học của con mới chọn, không còn buổi nào của con trước, và vị trí "Xem thêm" bắt đầu lại từ trang đầu.
AC14: Given X học lớp nhóm cùng học sinh Y (Y không liên kết với phụ huynh), When phụ huynh của X xem buổi chung đó, Then chỉ thấy điểm danh, nhận xét và bài tập **của X**; không thấy tên, điểm danh hay nhận xét của Y.
AC15: Given phụ huynh A và học sinh Z không liên kết với A, When A gọi trang/API nhận xét buổi học với định danh của Z hoặc định danh một buổi học mà chỉ Z tham gia (sửa ID trên URL, query, body), Then server từ chối theo quy tắc của S1 (403/404, không trả dữ liệu nào của Z).

**Yêu cầu chung**
AC16: Given phụ huynh dùng điện thoại rộng 375px, When xem danh sách, Then không có cuộn ngang, mỗi buổi là một thẻ riêng dễ phân biệt, vùng chạm của các nút ≥ 44px, chữ nội dung ≥ 16px.
AC17: Given nội dung do gia sư nhập có chứa ký tự như `<script>`, thẻ HTML hoặc liên kết, When hiển thị, Then nội dung được hiển thị dưới dạng văn bản (escape), không thực thi script, không render HTML.
AC18: Given lỗi mạng hoặc lỗi server khi tải danh sách hoặc "Xem thêm", When tải thất bại, Then hiển thị "Không tải được nhận xét. Thử lại" kèm nút thử lại; các buổi đã tải trước đó vẫn giữ nguyên.

Ưu tiên: AC1–AC18 đều là P0. AC1, AC4, AC5 là AC gốc của ticket. AC14–AC15 là **cổng chặn phát hành** (dữ liệu trẻ em).

## 6. Requirements

### P0 — Must-have
| ID | Yêu cầu | AC |
|---|---|---|
| R1 | Danh sách buổi đã diễn ra của con đang chọn, mới nhất trước, phân trang 10 buổi | AC1–AC3 |
| R2 | Thẻ buổi học đủ 4 phần: điểm danh, nội dung, nhận xét, bài tập; quy tắc nhãn khi thiếu dữ liệu | AC4–AC10 |
| R3 | Hiển thị văn bản an toàn, giữ xuống dòng, thu gọn khi dài | AC11, AC17 |
| R4 | Tái sử dụng kiểm tra quyền và "con đang chọn" của S1; lọc dữ liệu theo học sinh ở cả buổi lớp nhóm | AC13–AC15 |
| R5 | Mobile, a11y, xử lý lỗi tải | AC16, AC18 |

Ghi chú cho TechLead:
- API nên trả về dữ liệu **theo học sinh** (bản ghi điểm danh/nhận xét của học sinh trong buổi), không trả nguyên buổi học kèm danh sách học sinh rồi lọc ở frontend. Lọc ở frontend vẫn lộ dữ liệu qua network (AC14).
- Phân trang nên dùng cursor theo (thời gian bắt đầu, id) để không trùng/sót khi gia sư nhập thêm buổi trong lúc phụ huynh đang xem (E4).

### P1 — Nice-to-have
- Lọc theo môn học khi con học nhiều môn.
- Đánh dấu "Mới" cho nhận xét được cập nhật từ lần xem trước.
- Hiển thị "Cập nhật lúc HH:mm dd/mm" dưới nhận xét.
- Khối tóm tắt đầu trang: "Tháng này: 7/8 buổi có mặt".

### P2 — Future
- Ảnh/file đính kèm cho bài tập.
- Phụ huynh xác nhận đã đọc hoặc đánh dấu bài tập đã làm.
- Thông báo khi có nhận xét mới.
- Xuất báo cáo tháng (PDF).

## 7. Edge cases

| # | Tình huống | Hành vi mong đợi |
|---|---|---|
| E1 | Buổi đang diễn ra (đã bắt đầu, chưa kết thúc) | Chưa xuất hiện ở S3 (A3); xuất hiện sau giờ kết thúc |
| E2 | Hai buổi cùng thời gian bắt đầu (hai môn, hai gia sư) | Sắp xếp ổn định theo id; cả hai đều hiển thị, không mất buổi khi phân trang |
| E3 | Buổi bị huỷ sau khi đã diễn ra (admin sửa dữ liệu) | Biến mất khỏi danh sách ở lần tải tiếp theo (A3) |
| E4 | Gia sư nhập buổi mới trong lúc phụ huynh đang bấm "Xem thêm" | Không trùng, không sót buổi (dùng cursor); buổi mới thấy khi tải lại trang |
| E5 | Nhận xét chỉ có khoảng trắng hoặc xuống dòng | Coi như trống → "Gia sư chưa cập nhật" (A4) |
| E6 | Nhận xét rất dài (> 2.000 ký tự), từ rất dài không có khoảng trắng hoặc URL dài | Thu gọn theo AC11; ngắt từ để không tràn ngang trên 375px |
| E7 | Nội dung có emoji hoặc tiếng Việt tổ hợp dấu | Hiển thị đúng (UTF-8) |
| E8 | Gia sư nghỉ việc / tài khoản gia sư bị xoá | Vẫn hiển thị tên gia sư đã lưu ở buổi học; không làm mất nhận xét cũ |
| E9 | Học sinh vừa được liên kết, có lịch sử buổi học từ trước khi phụ huynh kích hoạt | Hiển thị toàn bộ lịch sử của học sinh (quyền theo liên kết, không theo ngày kích hoạt) |
| E10 | Phụ huynh bị huỷ liên kết với X khi đang xem | Request tiếp theo bị từ chối theo S1 (AC16 của GSTH-504) |
| E11 | Hai người giám hộ cùng xem X | Cả hai thấy cùng nội dung |
| E12 | Đổi con nhanh liên tiếp khi request cũ chưa trả về | Chỉ hiển thị kết quả của con đang chọn cuối cùng; bỏ phản hồi cũ đến muộn |
| E13 | Buổi học trực tuyến hoặc địa điểm khác nhau | Không ảnh hưởng S3 (hình thức/địa điểm hiển thị ở S2); có thể hiển thị thêm nếu sẵn dữ liệu |

## 8. Gợi ý kiểm thử (cho QA)

- **Seed tối thiểu:** con X có 23 buổi đã diễn ra (đủ 3 trang), gồm đủ các trạng thái điểm danh; 1 buổi trống nhận xét, 1 buổi trống bài tập nhưng có nhận xét, 1 buổi vắng không có nhận xét; 1 buổi bị huỷ và 2 buổi tương lai (không được hiện); 1 buổi lớp nhóm X + Y với nhận xét khác nhau.
- Kiểm AC14 bằng cách xem **phản hồi API** trong DevTools/Playwright, không chỉ giao diện: không có chuỗi nào về Y.
- Kiểm AC17 với nhận xét chứa `<img src=x onerror=alert(1)>`.
- Kiểm AC2/E4: thêm 1 buổi mới vào DB giữa hai lần bấm "Xem thêm".

## 9. Success metrics

- **Leading:** % phụ huynh đã kích hoạt mở màn nhận xét ≥ 1 lần/tuần; % buổi đã diễn ra có nhận xét (PRD G5, mục tiêu ≥ 80%).
- **Lagging:** giảm tin nhắn hỏi gia sư "hôm nay con học gì/bài tập gì" (PRD G3); tỷ lệ tiếp tục gói học sau 3 tháng.

## 10. Câu hỏi mở

| # | Câu hỏi | Ai trả lời | Chặn? |
|---|---|---|---|
| Q1 | Danh sách giá trị điểm danh (A2) có đúng với cách trung tâm đang làm không? Có cần "Đi muộn" không? | Owner | Không. Dùng A2 |
| Q2 | Mô hình dữ liệu buổi học/điểm danh/nhận xét theo học sinh do ai định nghĩa, khi phía quản trị (D1) chưa có? | TechLead | **Chặn** bắt đầu code. Đề xuất TechLead định nghĩa schema dùng chung cho S2–S4 và seed |
| Q3 | Phụ huynh có được thấy nhận xét **ngay khi** gia sư lưu, hay cần admin duyệt trước? | Owner | Không chặn v1 (giả định hiện ngay) |
| Q4 | Có giới hạn khoảng lịch sử (ví dụ chỉ 12 tháng gần nhất) không? | Owner | Không |
| Q5 | Buổi bị huỷ có nên hiện trong lịch sử với nhãn "Đã huỷ" không? | Owner / PO | Không (A3: không hiện) |

## 11. Phụ thuộc & định nghĩa hoàn thành

- **Đầu vào:** S1 hoàn thành (xác thực, kiểm tra quyền, con đang chọn); schema + seed buổi học (Q2).
- **DoD:** AC1–AC18 đạt; test tự động cho AC14–AC15 và AC17 chạy trong CI; kiểm thử ở viewport 375px.
