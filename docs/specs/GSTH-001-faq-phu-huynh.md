# GSTH-001 — Trang FAQ cho phụ huynh

| Mục | Giá trị |
|---|---|
| Ticket | GSTH-001 (Story) |
| Vai trò viết | BA Agent |
| Skill áp dụng | `write-spec` (.claude/skills/write-spec) |
| Trạng thái | Sẵn sàng cho Dev |

## 1. Bối cảnh & giả định

Repo hiện chưa có mã ứng dụng (chỉ có `CLAUDE.md` và `.claude/`), nên chưa có stack, routing hay design system để bám theo. Các giả định dưới đây áp dụng cho đến khi PO/TechLead quyết định khác:

| # | Giả định |
|---|---|
| A1 | Trang là **tĩnh**: nội dung FAQ nằm cố định trong mã nguồn (HTML/JSON), không có backend, CMS hay database. |
| A2 | Đường dẫn trang là `/faq`. Nếu site chỉ là file tĩnh không có router thì `/faq` tương ứng `faq/index.html` hoặc `faq.html`. Dev/TechLead chọn stack. |
| A3 | Ngôn ngữ giao diện và nội dung: **tiếng Việt**. |
| A4 | Tìm kiếm chạy hoàn toàn ở trình duyệt (client-side), lọc ngay khi gõ, không cần nút "Tìm". |
| A5 | Tìm kiếm **không phân biệt hoa/thường và không phân biệt dấu**: gõ `hoc phi` cũng khớp "Học phí". Lý do: phụ huynh thường gõ không dấu trên điện thoại. |
| A6 | Tìm kiếm khớp trên **nội dung câu hỏi** (theo đúng AC gốc). Khớp cả câu trả lời là P1. |
| A7 | Nội dung câu hỏi/trả lời trong spec là **nội dung mẫu**. Con số cụ thể (giá, giờ học, chính sách hoàn phí) cần PO xác nhận trước khi phát hành (xem Câu hỏi mở). |

## 2. Problem statement

Phụ huynh có con học tiểu học hay hỏi đi hỏi lại cùng một số câu về lịch học và học phí qua điện thoại/Zalo trước khi đăng ký. Chưa có nơi nào để họ tự tra cứu, nên họ phải chờ được trả lời, còn đội vận hành mất thời gian trả lời lặp lại.

## 3. Goals / Non-goals

**Goals**
- G1: Phụ huynh tự tìm được câu trả lời về lịch học và học phí, không cần liên hệ.
- G2: Trên điện thoại, tìm ra một câu hỏi cụ thể trong vài giây nhờ ô tìm kiếm.
- G3: Giảm số câu hỏi lặp lại gửi đến đội vận hành (đo sau khi có kênh đo, xem mục 8).

**Non-goals (out of scope)**
- Quản trị nội dung FAQ qua giao diện admin/CMS: trang là tĩnh, sửa nội dung bằng cách sửa mã nguồn.
- Đa ngôn ngữ: chỉ tiếng Việt.
- Chatbot, form gửi câu hỏi mới, bình luận, đánh giá "câu trả lời có hữu ích không": để giai đoạn sau.
- Nhóm câu hỏi ngoài **Lịch học** và **Học phí** (ví dụ: giáo viên, chương trình học, thanh toán online).
- Tìm kiếm phía server, gợi ý gõ (autocomplete), tìm mờ chịu lỗi chính tả (fuzzy search).
- Đăng nhập/cá nhân hoá.

## 4. User stories

- **US1**: As a phụ huynh có con học tiểu học, I want xem danh sách câu hỏi thường gặp được nhóm theo Lịch học và Học phí so that tôi nắm được thông tin cần thiết trước khi đăng ký mà không phải gọi hỏi.
- **US2**: As a phụ huynh đang tìm một thông tin cụ thể, I want gõ từ khoá để lọc câu hỏi so that tôi tìm thấy câu trả lời nhanh, không phải đọc hết cả trang.
- **US3**: As a phụ huynh dùng điện thoại, I want trang hiển thị gọn gàng, dễ đọc trên màn hình nhỏ so that tôi tra cứu được mọi lúc mà không phải phóng to hay cuộn ngang.

## 5. Acceptance criteria

AC1: Given phụ huynh mở `/faq`, When trang tải xong, Then thấy ít nhất 8 và tối đa 10 câu hỏi, chia thành đúng 2 nhóm có tiêu đề "Lịch học" và "Học phí", mỗi nhóm có ít nhất 3 câu hỏi.
AC2: Given phụ huynh đang ở `/faq`, When gõ một từ khoá vào ô tìm kiếm, Then chỉ còn hiển thị các câu hỏi có nội dung câu hỏi chứa từ khoá đó; các câu khác bị ẩn.
AC3: Given phụ huynh mở `/faq` ở chiều rộng viewport 375px, When xem toàn trang, Then không có thanh cuộn ngang, chữ không bị cắt hay chồng lên nhau, và ô tìm kiếm cùng mọi câu hỏi đều nhìn thấy và thao tác được.
AC4: Given ô tìm kiếm có từ khoá, When phụ huynh gõ cùng từ khoá nhưng khác hoa/thường hoặc không dấu (ví dụ `HOC PHI`, `hoc phi` cho "Học phí"), Then kết quả lọc giống hệt khi gõ đúng dấu và đúng hoa/thường.
AC5: Given ô tìm kiếm có từ khoá không khớp câu hỏi nào, When kết quả lọc rỗng, Then trang hiển thị thông báo "Không tìm thấy câu hỏi phù hợp" (hoặc câu tương đương) thay vì trang trống.
AC6: Given ô tìm kiếm đang có từ khoá, When phụ huynh xoá hết nội dung ô (hoặc chỉ còn khoảng trắng), Then toàn bộ câu hỏi và cả 2 nhóm hiển thị lại như lúc mới mở trang.
AC7: Given đang lọc, When một nhóm không còn câu hỏi nào khớp, Then tiêu đề nhóm đó cũng bị ẩn; nhóm còn câu khớp vẫn hiển thị tiêu đề.
AC8: Given phụ huynh xem một câu hỏi, When đọc câu trả lời, Then câu trả lời được hiển thị cho câu hỏi đó (mở sẵn, hoặc mở ra khi chạm vào câu hỏi nếu dùng dạng accordion), và thao tác được bằng bàn phím (Tab/Enter/Space).
AC9: Given người dùng trình đọc màn hình, When đến ô tìm kiếm, Then ô có nhãn truy cập được (label hoặc aria-label, ví dụ "Tìm câu hỏi"); vùng kết quả thông báo được thay đổi số kết quả (ví dụ `aria-live`).
AC10: Given phụ huynh mở `/faq` ở chiều rộng 375px, When chạm vào câu hỏi hoặc ô tìm kiếm, Then vùng chạm của mỗi phần tử tương tác cao ít nhất 44px, và cỡ chữ nội dung không nhỏ hơn 16px (tránh iOS tự phóng to khi focus ô nhập).

Ưu tiên: AC1–AC3 là AC gốc của ticket (P0). AC4–AC7 là P0 bổ sung từ edge case. AC8–AC10 là P0 về khả năng dùng và a11y ở mức tối thiểu.

## 6. Requirements

### P0 — Must-have
| ID | Yêu cầu | AC |
|---|---|---|
| R1 | Trang `/faq` hiển thị 8–10 câu hỏi, nhóm "Lịch học" và "Học phí" | AC1 |
| R2 | Ô tìm kiếm lọc theo nội dung câu hỏi, ngay khi gõ | AC2 |
| R3 | Khớp không phân biệt hoa/thường và dấu tiếng Việt (gồm cả `đ` ↔ `d`) | AC4 |
| R4 | Trạng thái không có kết quả, xoá từ khoá, ẩn nhóm rỗng | AC5, AC6, AC7 |
| R5 | Responsive, đúng ở 375px; không cuộn ngang | AC3, AC10 |
| R6 | Accessible ở mức cơ bản: bàn phím, nhãn, aria-live | AC8, AC9 |

### P1 — Nice-to-have
- Tìm cả trong nội dung câu trả lời.
- Làm nổi bật (highlight) từ khoá khớp trong câu hỏi.
- Hiển thị số kết quả ("Tìm thấy 3 câu hỏi").
- Nút xoá nhanh (×) trong ô tìm kiếm.
- Có thông tin liên hệ ở cuối trang cho câu hỏi chưa có trong danh sách.

### P2 — Future
- Lưu nội dung FAQ ở file dữ liệu riêng (JSON/Markdown) để sau này chuyển sang CMS dễ dàng. Dev nên tách dữ liệu khỏi phần hiển thị ngay từ v1.
- Thêm nhóm câu hỏi mới mà không phải sửa logic tìm kiếm.
- Deep link tới từng câu hỏi (`/faq#hoc-phi-1`).

## 7. Edge cases

| # | Tình huống | Hành vi mong đợi |
|---|---|---|
| E1 | Từ khoá chỉ gồm khoảng trắng | Coi như rỗng → hiện tất cả (AC6) |
| E2 | Từ khoá có khoảng trắng đầu/cuối, ví dụ `"  học phí "` | Trim trước khi so khớp |
| E3 | Gõ không dấu / sai hoa thường / `d` thay cho `đ` | Vẫn khớp (AC4) |
| E4 | Từ khoá chứa ký tự đặc biệt như `(`, `*`, `?`, `.` | Không lỗi JS; so khớp như chuỗi thường (không coi là regex) |
| E5 | Từ khoá rất dài (> 100 ký tự) hoặc dán đoạn văn | Không treo/lỗi; kết quả rỗng → thông báo AC5 |
| E6 | Không có câu nào khớp | Thông báo AC5, ẩn cả 2 tiêu đề nhóm |
| E7 | Chỉ một nhóm có câu khớp | Ẩn tiêu đề nhóm còn lại (AC7) |
| E8 | Câu hỏi/câu trả lời dài trên màn 375px | Xuống dòng tự nhiên, không tràn ngang |
| E9 | Nhiều từ, ví dụ `học phí tháng` | Khớp khi câu hỏi chứa **cả cụm** đúng thứ tự (substring). Tìm theo từng từ rời là P1. |
| E10 | JavaScript bị tắt hoặc lỗi tải | Toàn bộ câu hỏi và câu trả lời vẫn đọc được (nội dung có sẵn trong HTML); chỉ mất tính năng lọc |
| E11 | Xoay ngang điện thoại / màn hình rộng (≥1024px) | Bố cục vẫn đọc tốt; nội dung có chiều rộng tối đa hợp lý, không kéo dãn hết màn hình |
| E12 | Bàn phím ảo che màn hình khi focus ô tìm kiếm | Ô tìm kiếm vẫn thấy được; kết quả cuộn xem được |

## 8. Success metrics

Hiện chưa có analytics nên đây là chỉ số đề xuất, không chặn việc phát hành v1.
- **Leading**: % phiên vào `/faq` có dùng ô tìm kiếm; % lượt tìm kiếm trả về kết quả rỗng (mục tiêu < 20%, dùng để bổ sung câu hỏi).
- **Lagging**: Số câu hỏi về lịch học/học phí gửi qua điện thoại/Zalo giảm sau 1 tháng (đội vận hành tự đếm, so với tháng trước khi có FAQ).

## 9. Nội dung FAQ mẫu (cần PO duyệt)

**Lịch học**
1. Một buổi học kéo dài bao lâu?
2. Mỗi tuần con học mấy buổi?
3. Có thể chọn học buổi tối hoặc cuối tuần không?
4. Nếu con nghỉ một buổi thì có được học bù không?
5. Có thể đổi lịch học sau khi đã đăng ký không?

**Học phí**
6. Học phí được tính theo buổi hay theo tháng?
7. Đóng học phí bằng những hình thức nào?
8. Có được học thử trước khi đóng học phí không?
9. Có giảm học phí khi đăng ký nhiều tháng hoặc anh chị em cùng học không?
10. Nếu dừng học giữa chừng thì có được hoàn học phí không?

Câu trả lời cụ thể (giá, khung giờ, chính sách hoàn phí) để trống/placeholder cho đến khi PO cung cấp. Dev có thể dùng placeholder rõ ràng như "[PO cập nhật]", không tự bịa con số.

## 10. Câu hỏi mở

| # | Câu hỏi | Ai trả lời | Chặn? |
|---|---|---|---|
| Q1 | Stack và cấu trúc site (HTML tĩnh hay framework)? `/faq` nằm trong app nào? | TechLead | Không. Dev chọn mặc định HTML/CSS/JS tĩnh nếu chưa có quyết định |
| Q2 | Nội dung câu trả lời thật: giá, khung giờ, chính sách học bù/hoàn phí | PO | Không chặn Dev (dùng placeholder); **chặn phát hành** |
| Q3 | Có bộ nhận diện thương hiệu (logo, màu, font) không? | PO/Design | Không |
| Q4 | Câu trả lời mở sẵn hay dạng accordion? | Design/PO | Không. Mặc định accordion, tự mở các câu khớp khi đang lọc |
| Q5 | Kênh liên hệ hiển thị ở cuối trang (số điện thoại, Zalo)? | PO | Không (P1) |

## 11. Ghi chú cho QA

- Kiểm AC3/AC10 bằng Playwright với viewport 375×667 (và 375×812). Kiểm thêm `document.documentElement.scrollWidth <= 375`.
- Kiểm AC4 với các cặp: `Học phí`/`hoc phi`/`HỌC PHÍ`; `đổi lịch`/`doi lich`.
- Kiểm E10 bằng cách tắt JavaScript.
