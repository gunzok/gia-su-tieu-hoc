# GSTH-504 — S1: Phụ huynh đăng nhập và xem danh sách con được liên kết

| Mục | Giá trị |
|---|---|
| Ticket | GSTH-504 (Story), thuộc Epic GSTH-002 Cổng thông tin phụ huynh |
| Story trong epic | S1 · MoSCoW: **Must** · Ước lượng 3–4 ngày |
| Phụ thuộc | D1: dữ liệu học sinh, phụ huynh và lời mời do phía quản trị tạo |
| Vai trò viết | BA Agent |
| Skill áp dụng | `write-spec` (.claude/skills/write-spec) |
| Nguồn | Mô tả ticket; PRD `docs/product/GSTH-002-cong-thong-tin-phu-huynh.md` trên nhánh `agent/gsth-002` (chưa merge) |
| Trạng thái | Sẵn sàng cho TechLead/Dev, có 2 câu hỏi mở cần chốt (Q1, Q2) |

## 1. Bối cảnh & giả định

Repo `main` chưa có mã ứng dụng, chưa có stack, chưa có mô hình dữ liệu. PRD GSTH-002 ghi "Đăng nhập bằng SĐT + OTP hay email + mật khẩu?" là câu hỏi mở **chặn S1**. Để Dev không bị chặn, spec này viết AC **không phụ thuộc phương thức** nếu được, và đặt giả định mặc định bên dưới.

| # | Giả định | Nếu sai thì |
|---|---|---|
| A1 | Không có đăng ký công khai. Tài khoản phụ huynh chỉ tồn tại khi admin trung tâm đã tạo **lời mời** gắn với SĐT hoặc email và với ≥1 học sinh (PRD A4). | Cần thêm luồng xác minh quan hệ phụ huynh–con |
| A2 | **Mặc định phương thức:** lời mời gửi một liên kết kích hoạt (qua email) hoặc mã OTP (qua SĐT). Khi kích hoạt, phụ huynh đặt mật khẩu. Đăng nhập về sau = **SĐT hoặc email + mật khẩu**. | Nếu chốt OTP-only: AC5/AC6 đổi "mật khẩu" thành "OTP", các AC còn lại giữ nguyên |
| A3 | Lời mời dùng **một lần**, hết hạn sau **72 giờ**. Admin có thể gửi lại lời mời (tạo lời mời mới, lời mời cũ mất hiệu lực). | Chỉnh tham số |
| A4 | Quan hệ phụ huynh–học sinh là **nhiều–nhiều** (PRD A3): một phụ huynh có nhiều con; một con có nhiều người giám hộ, mỗi người một tài khoản riêng. | Ảnh hưởng mô hình dữ liệu |
| A5 | Phía quản trị (tạo học sinh, tạo lời mời, liên kết/huỷ liên kết) **ngoài phạm vi** S1. Để demo/test được, dùng seed hoặc import dữ liệu. | — |
| A6 | Thông tin hiển thị cho mỗi con ở S1 chỉ gồm: **họ tên, lớp, (tuỳ chọn) ảnh đại diện/chữ cái đầu**. Lịch học, nhận xét, học phí thuộc S2–S4. | — |
| A7 | Giao diện tiếng Việt, mobile-first, giờ Asia/Ho_Chi_Minh (PRD A1, A5). | — |
| A8 | Phiên đăng nhập hết hạn sau 30 ngày không hoạt động trên thiết bị đã đăng nhập (cân bằng giữa bảo mật và việc phụ huynh hiếm khi đăng nhập lại). | TechLead chỉnh |
| A9 | Khoá tạm đăng nhập 15 phút sau **5 lần sai liên tiếp** cho cùng một tài khoản. | TechLead chỉnh |

## 2. Problem statement

Cổng phụ huynh chứa dữ liệu cá nhân của trẻ em (PII). Trước khi phụ huynh xem được lịch học, nhận xét hay học phí (S2–S4), hệ thống phải xác định **ai đang đăng nhập** và **được xem những học sinh nào**. Nếu phân quyền sai, phụ huynh có thể thấy dữ liệu con người khác, vi phạm quyền riêng tư (PRD R2, Nghị định 13/2023/NĐ-CP, pháp chế cần xác nhận). S1 là nền tảng mà S2–S8 đều phụ thuộc.

## 3. Goals / Non-goals

**Goals**
- G1: Phụ huynh được mời kích hoạt tài khoản và đăng nhập được **mà không cần hỗ trợ** (đóng góp vào PRD G1: ≥60% kích hoạt trong 30 ngày).
- G2: **0 sự cố** phụ huynh xem được dữ liệu học sinh không liên kết với mình (kiểm bằng test phân quyền tự động và review bảo mật).
- G3: Phụ huynh nhiều con chuyển giữa các con trong ≤ 2 lần chạm.

**Non-goals / Out of scope**

| Hạng mục | Lý do |
|---|---|
| Giao diện admin tạo học sinh, mời phụ huynh, liên kết/huỷ liên kết | Thuộc epic Quản trị (D1). S1 dùng seed |
| Tự đăng ký công khai | Trái giả định A1 |
| Quên mật khẩu / đặt lại mật khẩu tự phục vụ | Story riêng (đề xuất "S1b"). Tạm thời admin gửi lại lời mời để phụ huynh đặt lại mật khẩu |
| Đăng nhập mạng xã hội (Google, Zalo, Facebook), 2FA | Chưa cần cho MVP |
| Phụ huynh tự sửa hồ sơ, đổi SĐT/email, tự thêm con | Cần quy trình xác minh với trung tâm |
| Lịch học, nhận xét, học phí, tổng quan của con | S2–S5 |
| Thông báo đẩy/Zalo/SMS ngoài việc gửi lời mời | S6, S7 |
| Đa ngôn ngữ, app native | PRD Non-goals |
| Quản lý thiết bị đăng nhập, "đăng xuất khỏi mọi thiết bị" | P2 |

## 4. User stories

- **US1 (kích hoạt)**: As a phụ huynh vừa nhận lời mời từ trung tâm, I want kích hoạt tài khoản bằng SĐT/email đã được mời so that tôi có quyền truy cập cổng mà không phải tự đăng ký.
- **US2 (đăng nhập)**: As a phụ huynh đã kích hoạt, I want đăng nhập lại bằng thông tin của mình so that tôi xem được thông tin của con bất cứ lúc nào.
- **US3 (danh sách con)**: As a phụ huynh đã đăng nhập, I want thấy đúng các con được trung tâm liên kết với tôi so that tôi biết mình đang xem thông tin của ai.
- **US4 (chuyển con)**: As a phụ huynh có từ 2 con học tại trung tâm, I want chuyển nhanh giữa các con so that tôi không phải đăng xuất hay dùng tài khoản khác.
- **US5 (riêng tư)**: As a phụ huynh, I want chắc chắn người khác không xem được dữ liệu của con tôi so that tôi yên tâm dùng cổng.
- **US6 (lỗi rõ ràng)**: As a phụ huynh gõ sai thông tin, I want thông báo lỗi dễ hiểu so that tôi biết cần làm gì tiếp.

## 5. Acceptance criteria

**Kích hoạt (US1)**
AC1: Given admin đã tạo lời mời còn hiệu lực cho SĐT hoặc email của phụ huynh, liên kết với ≥1 học sinh, When phụ huynh mở liên kết/nhập mã kích hoạt và đặt mật khẩu hợp lệ, Then tài khoản chuyển sang trạng thái "đã kích hoạt", phụ huynh được đăng nhập luôn và thấy danh sách con.
AC2: Given lời mời đã hết hạn (quá 72 giờ) hoặc đã được dùng, When phụ huynh mở liên kết/nhập mã đó, Then hệ thống không kích hoạt, hiển thị "Lời mời đã hết hạn hoặc đã được sử dụng. Vui lòng liên hệ trung tâm để được gửi lại." và không tạo tài khoản.
AC3: Given admin đã gửi lại lời mời mới cho cùng SĐT/email, When phụ huynh dùng lời mời cũ, Then lời mời cũ bị từ chối như AC2; chỉ lời mời mới nhất dùng được.
AC4: Given phụ huynh đang đặt mật khẩu khi kích hoạt, When mật khẩu ngắn hơn 8 ký tự hoặc hai ô nhập không khớp, Then hiển thị lỗi ngay tại ô tương ứng và không kích hoạt.

**Đăng nhập & lỗi (US2, US6)**
AC5: Given tài khoản đã kích hoạt, When phụ huynh nhập đúng SĐT/email và mật khẩu, Then đăng nhập thành công và vào màn danh sách con (hoặc thẳng màn của con đã chọn lần trước, xem AC12).
AC6: Given phụ huynh nhập sai mật khẩu, hoặc SĐT/email không tồn tại, hoặc tài khoản chưa kích hoạt, When bấm Đăng nhập, Then hiển thị **cùng một** thông báo "SĐT/email hoặc mật khẩu không đúng" (không tiết lộ tài khoản có tồn tại hay không), giữ lại giá trị SĐT/email đã nhập và xoá ô mật khẩu.
AC7: Given đã có 5 lần đăng nhập sai liên tiếp cho cùng một tài khoản, When phụ huynh thử lần thứ 6 trong vòng 15 phút, Then hệ thống từ chối kể cả khi mật khẩu đúng, và hiển thị "Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút."
AC8: Given phụ huynh để trống SĐT/email hoặc mật khẩu, hoặc nhập SĐT/email sai định dạng, When bấm Đăng nhập, Then hiển thị lỗi tại ô tương ứng và không gửi yêu cầu đăng nhập.
AC9: Given phụ huynh đã đăng nhập, When bấm Đăng xuất, Then phiên bị huỷ phía server; bấm Back của trình duyệt hoặc mở lại URL trang trong cổng đều chuyển về màn đăng nhập.

**Danh sách con (US3)**
AC10: Given phụ huynh được liên kết với N học sinh (N ≥ 1), When đăng nhập thành công, Then thấy đúng N học sinh đó (họ tên, lớp), không thiếu, không thừa, không có học sinh nào không liên kết.
AC11: Given tài khoản đã kích hoạt nhưng hiện không còn liên kết với học sinh nào (ví dụ admin đã huỷ liên kết), When đăng nhập, Then thấy thông báo "Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ trung tâm." và không thấy dữ liệu học sinh nào.

**Chuyển đổi giữa các con (US4)**
AC12: Given phụ huynh có ≥ 2 con được liên kết, When chọn một con từ bộ chọn (luôn hiển thị ở đầu trang trong cổng), Then mọi nội dung trên trang chuyển sang con đã chọn, tên con đang chọn hiển thị rõ, và lần đăng nhập sau mở mặc định con được chọn gần nhất.
AC13: Given phụ huynh chỉ có 1 con được liên kết, When vào cổng, Then không hiển thị bộ chọn con; tên con vẫn hiển thị để phụ huynh biết đang xem ai.

**Phân quyền (US5) — bắt buộc có test tự động**
AC14: Given phụ huynh A đã đăng nhập và học sinh X **không** liên kết với A, When A gọi bất kỳ trang hoặc API nào có định danh của X (sửa ID trên URL, query string, body request), Then server từ chối (403 hoặc 404, phản hồi không chứa bất kỳ dữ liệu nào của X), và không có hành vi nào ở frontend làm lộ dữ liệu của X.
AC15: Given người dùng chưa đăng nhập hoặc phiên đã hết hạn, When truy cập trang hoặc API của cổng phụ huynh, Then bị chuyển về màn đăng nhập (trang) hoặc nhận 401 (API); sau khi đăng nhập lại thì quay về trang đang định mở **chỉ khi** trang đó thuộc về con của chính phụ huynh này.
AC16: Given phụ huynh A đang đăng nhập và admin huỷ liên kết giữa A và học sinh X, When A tải lại trang hoặc gọi API tiếp theo liên quan X, Then áp dụng AC14 ngay (kiểm tra quyền ở mỗi request, không dựa vào danh sách đã cache trong phiên).
AC17: Given học sinh X liên kết với hai người giám hộ A và B (hai tài khoản), When A và B lần lượt đăng nhập, Then cả hai đều thấy X; A không thấy các con khác của B (nếu chúng không liên kết với A) và ngược lại.

**Yêu cầu chung**
AC18: Given phụ huynh dùng điện thoại có chiều rộng 375px, When xem các màn kích hoạt, đăng nhập, danh sách con và bộ chọn con, Then không có cuộn ngang, vùng chạm ≥ 44px, ô nhập có nhãn truy cập được và hỗ trợ trình quản lý mật khẩu (`autocomplete="username"` / `"current-password"` / `"new-password"`).
AC19: Given mọi luồng ở trên, When dữ liệu đăng nhập được gửi đi và lưu trữ, Then chỉ truyền qua HTTPS, mật khẩu được lưu dạng hash (thuật toán chuyên dụng, ví dụ bcrypt/argon2), cookie phiên đặt `HttpOnly`, `Secure`, `SameSite`; mật khẩu và mã OTP không xuất hiện trong log.

Ưu tiên: tất cả AC1–AC19 là P0 vì đây là story Must về bảo mật. AC14–AC17 là **cổng chặn phát hành**: thiếu test tự động cho các AC này thì QA trả FAIL.

## 6. Requirements

### P0 — Must-have
| ID | Yêu cầu | AC |
|---|---|---|
| R1 | Kích hoạt tài khoản từ lời mời dùng một lần, có hạn | AC1–AC4 |
| R2 | Đăng nhập/đăng xuất, thông báo lỗi chung, khoá tạm khi sai nhiều lần | AC5–AC9 |
| R3 | Danh sách con đúng theo liên kết, có trạng thái rỗng | AC10, AC11 |
| R4 | Bộ chọn con khi có ≥ 2 con, nhớ con chọn gần nhất | AC12, AC13 |
| R5 | Kiểm tra quyền phía server ở **mỗi** request theo bảng liên kết phụ huynh–học sinh, kèm bộ test phân quyền tự động | AC14–AC17 |
| R6 | Mobile, a11y cơ bản, bảo mật lưu trữ/truyền tải | AC18, AC19 |

Ghi chú kỹ thuật cho TechLead (không quy định cách làm, chỉ là ràng buộc):
- Nên có một hàm/middleware dùng chung kiểu "phụ huynh này có được truy cập học sinh này không" để S2–S4 tái sử dụng, tránh mỗi endpoint tự kiểm tra.
- Dùng ID học sinh khó đoán (UUID) giúp giảm rủi ro, nhưng **không thay thế** cho kiểm tra quyền ở AC14.

### P1 — Nice-to-have
- Hiển thị/ẩn mật khẩu bằng nút con mắt.
- Ghi audit log cho đăng nhập thành công/thất bại và truy cập bị từ chối (403) để phát hiện dò ID.
- Gửi email/SMS báo khi tài khoản bị khoá tạm vì đăng nhập sai nhiều lần.
- Ảnh đại diện của con trong bộ chọn.

### P2 — Future
- Quên mật khẩu tự phục vụ (story S1b).
- Đăng nhập OTP không cần mật khẩu, đăng nhập bằng Zalo.
- Quản lý phiên/thiết bị, đăng xuất khỏi mọi thiết bị.
- Phân quyền chi tiết theo từng người giám hộ (ví dụ người giám hộ chỉ xem lịch, không xem học phí).

## 7. Edge cases

| # | Tình huống | Hành vi mong đợi |
|---|---|---|
| E1 | Lời mời gửi tới SĐT/email đã có tài khoản kích hoạt (ví dụ trung tâm thêm con thứ 2) | Không tạo tài khoản mới. Con mới được liên kết vào tài khoản hiện có và hiện trong danh sách ở lần tải tiếp theo. Liên kết kích hoạt chỉ cần đăng nhập |
| E2 | SĐT nhập theo nhiều định dạng: `0912 345 678`, `+84912345678`, `84912345678` | Chuẩn hoá về một định dạng trước khi so khớp; tất cả đều được coi là cùng một SĐT |
| E3 | Email khác hoa/thường hoặc có khoảng trắng đầu/cuối | Trim và so khớp không phân biệt hoa/thường |
| E4 | Phụ huynh mở liên kết kích hoạt hai lần song song (hai tab) | Chỉ một lần kích hoạt thành công; tab còn lại nhận thông báo như AC2 |
| E5 | Phiên hết hạn khi phụ huynh đang xem trang | Request tiếp theo áp dụng AC15; không hiển thị dữ liệu cũ của con sau khi chuyển về màn đăng nhập |
| E6 | Hai con trùng họ tên | Bộ chọn hiển thị thêm lớp (và năm sinh nếu cần) để phân biệt |
| E7 | Tên con rất dài trên màn 375px | Cắt bằng dấu "…" trong bộ chọn, hiển thị đủ ở tiêu đề trang; không tràn ngang |
| E8 | Con được chọn gần nhất (AC12) đã bị huỷ liên kết | Mặc định chọn con đầu tiên còn liên kết; nếu không còn con nào → AC11 |
| E9 | Phụ huynh có nhiều con (ví dụ ≥ 5) | Bộ chọn vẫn dùng được (danh sách cuộn), không vỡ bố cục |
| E10 | Dò thông tin qua thời gian phản hồi hoặc thông báo lỗi khác nhau | Thông báo và mã lỗi giống nhau cho mọi trường hợp sai (AC6) |
| E11 | Thử ngẫu nhiên nhiều tài khoản từ một IP | Giới hạn tần suất theo IP (ngưỡng do TechLead chọn), bổ sung cho khoá theo tài khoản ở AC7 |
| E12 | Học sinh đã nghỉ học / ngừng hoạt động nhưng vẫn còn liên kết | Theo trạng thái liên kết do admin quản lý. S1 hiển thị mọi học sinh còn liên kết; quy tắc "ẩn học sinh đã nghỉ" là câu hỏi mở Q4 |
| E13 | Mở liên kết kích hoạt khi đang đăng nhập bằng tài khoản khác trên cùng trình duyệt | Hiển thị cảnh báo và yêu cầu đăng xuất tài khoản hiện tại trước khi kích hoạt; không tự gộp hai tài khoản |

## 8. Gợi ý kiểm thử (cho QA)

- **Ma trận phân quyền** (seed tối thiểu): phụ huynh A–con X, Y; phụ huynh B–con Y, Z; phụ huynh C không có con. Kiểm từng cặp (phụ huynh × học sinh) trên **mọi** endpoint có định danh học sinh: chỉ các cặp có liên kết mới trả về dữ liệu.
- Kiểm AC14 bằng cách sửa ID học sinh trên URL và gọi API trực tiếp (không qua UI).
- Kiểm AC16: huỷ liên kết trong DB/seed khi phiên đang mở, rồi gọi lại API.
- Kiểm AC6/E10: so sánh nội dung và mã phản hồi giữa "sai mật khẩu" và "tài khoản không tồn tại".
- Viewport 375×667 cho AC18.

## 9. Success metrics

- **Leading:** % lời mời được kích hoạt trong 72 giờ; % lần đăng nhập thành công ngay lần đầu; số lần khoá tạm/tuần.
- **Lagging:** số yêu cầu hỗ trợ "không đăng nhập được" gửi trung tâm/tháng; số sự cố phân quyền = 0.

## 10. Câu hỏi mở

| # | Câu hỏi | Ai trả lời | Chặn? |
|---|---|---|---|
| Q1 | Chốt phương thức: SĐT/email + mật khẩu (giả định A2) hay OTP-only? Kênh gửi OTP qua SĐT (SMS, Zalo ZNS) và chi phí | Owner / TechLead | **Chặn** phần kích hoạt qua SĐT. Dev làm trước được luồng email + mật khẩu |
| Q2 | Stack kỹ thuật, nơi lưu dữ liệu, cơ chế phiên (cookie session hay JWT) | TechLead | **Chặn** bắt đầu code |
| Q3 | Hạn lời mời (72 giờ), ngưỡng khoá (5 lần / 15 phút), thời hạn phiên (30 ngày) có phù hợp không? | Owner / TechLead | Không. Dùng giá trị giả định |
| Q4 | Học sinh đã nghỉ học có còn hiển thị cho phụ huynh không (để xem lại lịch sử học phí)? | Owner | Không chặn S1 |
| Q5 | Yêu cầu pháp lý về dữ liệu trẻ em dưới 16 tuổi (Nghị định 13/2023/NĐ-CP): có cần phụ huynh đồng ý điều khoản khi kích hoạt không? | Pháp chế | Không chặn Dev, **chặn go-live** |
| Q6 | Ai làm dữ liệu seed và lời mời mẫu khi epic Quản trị (D1) chưa có? | TechLead / PO | Không. Đề xuất Dev tạo script seed trong S1 |

## 11. Phụ thuộc & định nghĩa hoàn thành

- **Đầu vào cần có:** quyết định Q2 (stack); seed học sinh, phụ huynh, liên kết, lời mời (Q6).
- **Đầu ra cho S2–S4:** cơ chế xác thực + hàm kiểm tra quyền phụ huynh–học sinh dùng chung (R5) + "con đang chọn" (AC12) làm ngữ cảnh cho các màn chi tiết.
- **DoD:** AC1–AC19 đạt; test tự động cho AC14–AC17 chạy trong CI; review bảo mật (`/security-review`) không còn vấn đề mức cao.
