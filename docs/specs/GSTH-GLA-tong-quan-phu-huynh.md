# GSTH-GLA — S5: Trang tổng quan "một nơi" cho phụ huynh

| Mục | Giá trị |
|---|---|
| Ticket | GSTH-GLA (Story), thuộc Epic GSTH-002 Cổng thông tin phụ huynh |
| Story trong epic | S5 · MoSCoW: **Should** · Ước lượng 2 ngày |
| Phụ thuộc | S1 (GSTH-504) đăng nhập, con đang chọn, phân quyền · S2 lịch học · S3 (GSTH-5I7) nhận xét buổi học · S4 học phí |
| Vai trò viết | BA Agent |
| Skill áp dụng | `write-spec` (.claude/skills/write-spec) |
| Nguồn | Mô tả ticket; PRD `docs/product/GSTH-002-cong-thong-tin-phu-huynh.md` (nhánh `agent/gsth-002`); spec S1 (nhánh `agent/gsth-504`); spec S3 (nhánh `agent/gsth-5i7`). Tất cả chưa merge. **Spec S2 và S4 chưa có**: dữ liệu của hai khối này lấy theo phần tóm tắt AC của PRD |
| Trạng thái | Sẵn sàng cho TechLead/Dev sau khi có S2, S3, S4 |

## 1. Bối cảnh & giả định

Repo `main` chưa có mã ứng dụng. Nhánh `agent/gsth-001` (chưa merge) dùng HTML/CSS/JS thuần, Node ≥ 20, test bằng `node:test` + Playwright. Cổng phụ huynh cần backend nên stack do TechLead chốt (S1 Q2). S5 **không tạo dữ liệu mới**, chỉ tóm tắt dữ liệu S2, S3, S4 đã có.

| # | Giả định | Nếu sai thì |
|---|---|---|
| A1 | Sau khi có S5, trang tổng quan là **màn hình mặc định sau đăng nhập** và khi đổi con. Thay đổi này cập nhật AC5 của S1 ("vào màn danh sách con / màn của con đã chọn"). | Giữ điểm vào cũ, thêm menu "Tổng quan" |
| A2 | Mọi khối hiển thị dữ liệu của **con đang chọn** (S1 AC12). | — |
| A3 | **Buổi học kế tiếp** = buổi có giờ bắt đầu ≥ hiện tại, gần nhất, trạng thái "đã lên lịch" hoặc "đã dời" (không tính buổi đã huỷ), trong cửa sổ 14 ngày của S2. Buổi đang diễn ra không được tính. | Đổi theo spec S2 khi có |
| A4 | **Nhận xét mới nhất** = buổi đã diễn ra gần nhất **có nhận xét** (định nghĩa "có nhận xét" theo S3 A4). Không lấy buổi vắng có nhận xét trống. | Nếu muốn hiện buổi mới nhất kể cả chưa có nhận xét → đổi AC6 |
| A5 | **Công nợ hiện tại** = tổng tiền các hoá đơn **chưa đóng** (kể cả quá hạn) **của con đang chọn**, đúng như quy tắc S4 ("Tổng công nợ hiện tại đúng bằng tổng các hoá đơn chưa đóng"). | Nếu hoá đơn theo gia đình chứ không theo con → xem Q2 |
| A6 | "Tải xong" = cả 3 khối đã hiện **dữ liệu thật hoặc trạng thái rỗng/lỗi cuối cùng** (không còn khung chờ). Thời gian tính từ lúc bắt đầu điều hướng tới trang. | TechLead chọn chỉ số khác (ví dụ LCP) |
| A7 | Đo hiệu năng **lab** bằng Playwright/Chrome DevTools với cấu hình mạng "4G" và CPU giả lập điện thoại tầm trung (cấu hình cụ thể TechLead chốt, Q3); lấy p75 trên ≥ 20 lần tải. Đo **thực tế** (RUM) bổ sung khi có analytics. | — |
| A8 | Phụ huynh đã đăng nhập (phiên còn hạn). Màn đăng nhập không tính vào ngân sách 2 giây. | — |
| A9 | Tiền tệ VND, định dạng `1.250.000 ₫`; giờ Asia/Ho_Chi_Minh; mobile-first; tiếng Việt. | — |

## 2. Problem statement

Sau S2–S4, thông tin nằm ở 3 màn riêng. Phụ huynh bận chỉ muốn **liếc vài giây** để biết: con học buổi tới lúc nào, gần đây học thế nào, còn phải đóng bao nhiêu (JTBD của PRD). Phải mở lần lượt 3 màn thì chậm và dễ bỏ sót, nhất là khoản học phí quá hạn.

## 3. Goals / Non-goals

**Goals**
- G1: Phụ huynh thấy đủ 3 thông tin chính của con trên **một màn hình**, không cần cuộn trên điện thoại 375×667.
- G2: Trang tải xong ≤ 2 giây ở p75 trên mạng 4G (theo A6, A7).
- G3: Từ tổng quan sang màn chi tiết tương ứng chỉ cần **1 lần chạm**.

**Non-goals / Out of scope**

| Hạng mục | Lý do |
|---|---|
| Dữ liệu và màn chi tiết lịch học, nhận xét, học phí | S2, S3, S4 |
| Thông báo đổi lịch, nhắc học phí (đẩy/email) | S6, S7 |
| Biểu đồ tiến độ, thống kê chuyên cần | S8 |
| Gộp nhiều con trên một màn tổng quan | v1 xem theo từng con (A2); xem P2 |
| Thanh toán online từ khối công nợ | PRD Non-goals |
| Phụ huynh tuỳ biến bố cục, ẩn/hiện khối | Không cần cho MVP |
| Cập nhật thời gian thực (tự làm mới khi dữ liệu thay đổi) | Dữ liệu được làm mới khi tải lại trang; xem P1 |
| Chế độ offline / PWA | P2 |

## 4. User stories

- **US1**: As a phụ huynh vừa đăng nhập, I want thấy ngay buổi học kế tiếp, nhận xét mới nhất và công nợ hiện tại của con so that tôi nắm tình hình trong vài giây.
- **US2**: As a phụ huynh, I want chạm vào một khối để xem chi tiết so that tôi không phải tìm đường trong menu.
- **US3**: As a phụ huynh có khoản học phí quá hạn, I want khoản đó được làm nổi bật so that tôi không quên đóng.
- **US4**: As a phụ huynh có nhiều con, I want tổng quan đổi theo con tôi chọn so that thông tin không bị lẫn.
- **US5**: As a phụ huynh dùng 4G, I want trang mở nhanh so that tôi xem được cả khi đang di chuyển.

## 5. Acceptance criteria

**Bố cục & điều hướng (US1, US2)**
AC1: Given phụ huynh đã đăng nhập và đang chọn con X, When mở trang Tổng quan (hoặc vừa đăng nhập xong, theo A1), Then thấy đúng 3 khối theo thứ tự: **Buổi học kế tiếp**, **Nhận xét mới nhất**, **Công nợ hiện tại**, và tên con X hiển thị rõ ở đầu trang.
AC2: Given trang Tổng quan đang hiển thị, When phụ huynh chạm vào bất kỳ đâu trên khối Buổi học kế tiếp / Nhận xét mới nhất / Công nợ hiện tại, Then chuyển sang màn chi tiết tương ứng (Lịch học S2 / Nhận xét S3 / Học phí S4) của **cùng con X**.
AC3: Given điện thoại 375×667, When trang tải xong ở trạng thái có đủ dữ liệu, Then cả 3 khối đều nằm trọn trong màn hình đầu tiên (không cần cuộn), không có cuộn ngang, mỗi khối có vùng chạm ≥ 44px và là một liên kết truy cập được bằng bàn phím và trình đọc màn hình (có nhãn, ví dụ "Xem lịch học").

**Khối Buổi học kế tiếp**
AC4: Given X có buổi học kế tiếp theo A3, When xem khối, Then hiển thị: thứ/ngày, giờ bắt đầu–kết thúc, môn, gia sư, hình thức/địa điểm; nếu buổi là hôm nay hoặc ngày mai thì hiện nhãn "Hôm nay"/"Ngày mai".
AC5: Given buổi kế tiếp có trạng thái "đã dời", When xem khối, Then hiển thị giờ **mới** kèm nhãn "Đã dời"; Given X không có buổi nào trong 14 ngày tới (hoặc mọi buổi đều đã huỷ), Then khối hiển thị "Chưa có buổi học nào trong 2 tuần tới" và vẫn dẫn sang màn Lịch học.

**Khối Nhận xét mới nhất**
AC6: Given X có ít nhất một buổi đã diễn ra có nhận xét, When xem khối, Then hiển thị nhận xét của buổi gần nhất có nhận xét (A4): ngày buổi học, môn, điểm danh, tối đa 3 dòng đầu của nhận xét kèm dấu "…" nếu dài hơn, và dòng "Bài tập: có/không".
AC7: Given X chưa có buổi nào có nhận xét, When xem khối, Then hiển thị "Chưa có nhận xét nào" và vẫn dẫn sang màn Nhận xét.

**Khối Công nợ hiện tại (US3)**
AC8: Given X có hoá đơn chưa đóng, When xem khối, Then hiển thị tổng công nợ (VND, định dạng A9) bằng **đúng** tổng hiển thị ở màn Học phí S4, số hoá đơn chưa đóng, và hạn đóng gần nhất.
AC9: Given trong các hoá đơn chưa đóng có ít nhất một hoá đơn **quá hạn**, When xem khối, Then khối chuyển sang kiểu cảnh báo (màu và biểu tượng, kèm chữ "Quá hạn" — không chỉ dựa vào màu) và hiện số tiền quá hạn.
AC10: Given X không có hoá đơn chưa đóng, When xem khối, Then hiển thị "Đã đóng đủ học phí" (công nợ 0 ₫) và vẫn dẫn sang màn Học phí.

**Tải trang & lỗi (US5)**
AC11: Given phụ huynh đã đăng nhập, dùng mạng 4G theo cấu hình A7, When mở trang Tổng quan, Then thời gian "tải xong" (A6) ở p75 trên ≥ 20 lần đo là **≤ 2,0 giây**.
AC12: Given trang đang tải, When dữ liệu của một khối chưa về, Then khối đó hiện khung chờ (skeleton) đúng kích thước cuối cùng, để bố cục không bị nhảy khi dữ liệu về.
AC13: Given dữ liệu của một khối bị lỗi hoặc quá 5 giây chưa về, When các khối khác đã có dữ liệu, Then chỉ khối lỗi hiển thị "Không tải được. Thử lại" kèm nút thử lại (chỉ tải lại khối đó); các khối còn lại vẫn hiển thị bình thường.

**Theo con & phân quyền (US4)**
AC14: Given phụ huynh có ≥ 2 con, When đổi con bằng bộ chọn của S1, Then cả 3 khối cập nhật sang dữ liệu của con mới chọn; không còn dữ liệu nào của con trước hiển thị, kể cả trong lúc đang tải.
AC15: Given phụ huynh A và học sinh Z không liên kết với A, When A gọi trang/API tổng quan với định danh của Z, Then server từ chối theo quy tắc S1 (403/404, không trả dữ liệu nào của Z). Áp dụng cho mọi API mà trang tổng quan gọi.

**Nhất quán dữ liệu**
AC16: Given cùng một thời điểm, When so sánh trang Tổng quan với các màn chi tiết S2, S3, S4 của cùng con, Then buổi kế tiếp, nhận xét mới nhất và tổng công nợ trùng khớp. Nếu dữ liệu thay đổi (ví dụ vừa đóng tiền), tải lại trang Tổng quan phải hiện số mới (không cache quá thời điểm tải).

Ưu tiên: AC1–AC16 đều là P0 của story này. AC2 và AC11 là AC gốc của ticket. AC15 là **cổng chặn phát hành** (dữ liệu trẻ em).

## 6. Requirements

### P0 — Must-have (của story Should này)
| ID | Yêu cầu | AC |
|---|---|---|
| R1 | 3 khối tóm tắt, thứ tự cố định, mỗi khối dẫn sang màn chi tiết của cùng con | AC1–AC3 |
| R2 | Quy tắc chọn dữ liệu và trạng thái rỗng cho từng khối | AC4–AC10 |
| R3 | Ngân sách hiệu năng ≤ 2 giây p75 trên 4G, có test đo tự động | AC11 |
| R4 | Tải độc lập từng khối, skeleton, lỗi cục bộ có thử lại | AC12, AC13 |
| R5 | Theo con đang chọn, tái sử dụng phân quyền S1 | AC14, AC15 |
| R6 | Số liệu khớp màn chi tiết: **dùng chung logic tính** với S2/S3/S4, không tính lại riêng | AC16 |

Ghi chú cho TechLead (ràng buộc, không phải cách làm bắt buộc):
- Để đạt 2 giây trên 4G, nên có **một API tổng hợp** trả về dữ liệu tóm tắt của cả 3 khối cho một học sinh, thay vì 3+ request nối tiếp. API này vẫn phải trả lỗi theo từng khối để đạt AC13.
- Trang không nên tải toàn bộ danh sách buổi học/hoá đơn chỉ để lấy 1 bản ghi.
- Công thức công nợ phải là **một hàm duy nhất** dùng cho cả S4 và S5 (AC16).
- Đặt ngân sách tài nguyên cho trang (dung lượng JS/CSS) để giữ AC11; con số cụ thể do TechLead chốt.

### P1 — Nice-to-have
- Dòng "Cập nhật lúc HH:mm" và kéo xuống để làm mới (pull-to-refresh).
- Khối nhận xét đánh dấu "Mới" nếu phụ huynh chưa mở nhận xét đó.
- Nút "Sao chép thông tin chuyển khoản" ngay trong khối công nợ.
- Hiện thêm buổi thứ 2 sắp tới.

### P2 — Future
- Tổng quan gộp tất cả các con trên một màn.
- Khối tiến độ (S8) trên tổng quan.
- Hiển thị offline dữ liệu lần tải gần nhất (PWA).

## 7. Edge cases

| # | Tình huống | Hành vi mong đợi |
|---|---|---|
| E1 | Buổi kế tiếp bắt đầu sau vài phút, phụ huynh để trang mở qua giờ bắt đầu | Không tự đổi khi đang mở; tải lại trang thì chuyển sang buổi kế tiếp mới (A3) |
| E2 | Hai buổi kế tiếp cùng giờ (hai môn) | Hiện buổi có id nhỏ hơn (sắp xếp ổn định, giống S3 E2); P1: hiện cả hai |
| E3 | Buổi kế tiếp bị huỷ sau khi trang đã tải | Tải lại trang thì khối hiện buổi kế tiếp còn hiệu lực, hoặc trạng thái rỗng |
| E4 | Nhận xét mới nhất chứa HTML/script | Hiển thị dạng văn bản (escape), như S3 AC17 |
| E5 | Nhận xét chỉ có 1 dòng rất dài, không có khoảng trắng | Ngắt từ, cắt tối đa 3 dòng, không tràn ngang |
| E6 | Công nợ rất lớn (≥ 100.000.000 ₫) | Hiển thị đủ số trên 375px, không cắt chữ số |
| E7 | Có hoá đơn số tiền 0 ₫ hoặc âm (giảm trừ/hoàn tiền) | Theo quy tắc S4; S5 không tự xử lý riêng. Ghi nhận phụ thuộc S4 |
| E8 | Hoá đơn có hạn đóng là hôm nay | Chưa tính là quá hạn cho đến hết ngày hôm đó (giờ Asia/Ho_Chi_Minh). Nếu S4 quy định khác thì theo S4 |
| E9 | Con mới được liên kết, chưa có dữ liệu nào | Cả 3 khối hiện trạng thái rỗng (AC5, AC7, AC10), không báo lỗi |
| E10 | Phụ huynh không còn con nào được liên kết | Áp dụng S1 AC11, không hiện trang Tổng quan |
| E11 | Đổi con liên tục khi request cũ chưa trả về | Chỉ hiển thị kết quả của con chọn cuối cùng; bỏ phản hồi cũ đến muộn (AC14) |
| E12 | Cả 3 khối đều lỗi | Mỗi khối hiện lỗi và nút thử lại riêng; trang không trắng |
| E13 | Mạng rất chậm (2G/3G) | Không bắt buộc đạt 2 giây; skeleton hiện ngay, sau 5 giây áp dụng AC13 |

## 8. Gợi ý kiểm thử (cho QA)

- **Seed:** con X có buổi kế tiếp "Ngày mai" + 1 buổi đã dời + 1 buổi đã huỷ sớm hơn; nhận xét mới nhất dài > 3 dòng; 2 hoá đơn chưa đóng (1 quá hạn). Con Y không có dữ liệu. Phụ huynh A–X, Y; phụ huynh B–Z.
- **AC11:** test Playwright với throttling mạng 4G + CPU theo cấu hình Q3, 20 lần tải liên tiếp (bỏ cache), tính p75 thời điểm cả 3 khối có `data-state` khác `loading`. Chạy trong CI như một kiểm tra hiệu năng.
- **AC13:** chặn (route abort) API của một khối và kiểm hai khối còn lại vẫn hiển thị.
- **AC16:** so số tổng công nợ giữa Tổng quan và màn Học phí trên cùng seed.
- **AC15:** gọi API tổng quan với id học sinh của B bằng phiên của A.

## 9. Success metrics

- **Leading:** p75 thời gian tải tổng quan (mục tiêu ≤ 2 giây, PRD Success Metrics); % phiên chạm từ tổng quan sang màn chi tiết.
- **Lagging:** WAU phụ huynh (PRD G2 ≥ 40%); % hoá đơn đóng đúng hạn (PRD G4) sau khi khối công nợ quá hạn được làm nổi bật.

## 10. Câu hỏi mở

| # | Câu hỏi | Ai trả lời | Chặn? |
|---|---|---|---|
| Q1 | Spec S2 (lịch học) và S4 (học phí) chưa có. Quy tắc buổi kế tiếp (A3) và công nợ (A5) cần đối chiếu khi BA viết S2/S4 | BA / PO | **Chặn** bắt đầu code S5 (phụ thuộc theo PRD) |
| Q2 | Hoá đơn học phí theo **từng con** hay theo **gia đình**? Nếu theo gia đình, khối công nợ hiện tổng của phụ huynh hay của con đang chọn? | Owner | Chặn AC8 |
| Q3 | Cấu hình đo "4G" chuẩn (băng thông, độ trễ, CPU throttling) và thiết bị tham chiếu | TechLead | Chặn kiểm AC11 |
| Q4 | Có đồng ý đổi màn mặc định sau đăng nhập thành Tổng quan (A1, sửa AC5 của S1) không? | PO | Không. Mặc định đồng ý |
| Q5 | Khối nhận xét: lấy buổi gần nhất có nhận xét (A4) hay buổi gần nhất bất kể đã có nhận xét chưa? | PO | Không. Dùng A4 |

## 11. Phụ thuộc & định nghĩa hoàn thành

- **Đầu vào:** S1, S2, S3, S4 hoàn thành; logic dùng chung cho buổi kế tiếp, nhận xét mới nhất, công nợ; trả lời Q2, Q3.
- **DoD:** AC1–AC16 đạt; test hiệu năng AC11 và test phân quyền AC15 chạy trong CI; kiểm thử ở viewport 375×667.
