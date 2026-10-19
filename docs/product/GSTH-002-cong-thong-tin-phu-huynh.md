# GSTH-002 — Epic: Cổng thông tin phụ huynh

> PRD (theo skill `write-spec`) · Người viết: PO Agent · Ngày: 2026-10-19 · Trạng thái: Draft → Analysis

## TL;DR
- **Vấn đề:** phụ huynh học sinh tiểu học phải hỏi gia sư/trung tâm qua nhiều kênh (Zalo, gọi điện, giấy) mới biết lịch học, con học đến đâu, còn nợ học phí bao nhiêu.
- **Giải pháp:** một cổng web (ưu tiên mobile) để phụ huynh tự xem **lịch học – tiến độ – học phí** của con ở một nơi.
- **MVP (Must):** đăng nhập & liên kết con, lịch học, nhận xét theo buổi, học phí & trạng thái thanh toán.
- **Chia thành 8 User Story** (INVEST), mỗi story 1–4 ngày công.
- **Không làm ở v1:** thanh toán online, chat trực tiếp, app native.

## 1. Bối cảnh & giả định
Repo hiện chưa có mã nguồn hay tài liệu sản phẩm nào khác (chỉ có cấu hình agent). Vì vậy PO đưa ra các giả định sau — **cần owner xác nhận**:

| # | Giả định | Ảnh hưởng nếu sai |
|---|---|---|
| A1 | Sản phẩm là web app; cổng phụ huynh là web responsive, mobile-first (phụ huynh chủ yếu dùng điện thoại). | Nếu cần app native → thêm epic riêng. |
| A2 | Dữ liệu lịch học, nhận xét buổi học, học phí do **gia sư/admin nhập** ở phía quản trị (epic khác). Cổng phụ huynh chỉ **đọc**. | Nếu chưa có phía nhập liệu → cổng không có dữ liệu; xem Rủi ro R1. |
| A3 | Một phụ huynh có thể có ≥1 con; một con có thể có ≥1 người giám hộ. | Ảnh hưởng mô hình dữ liệu (quan hệ nhiều-nhiều). |
| A4 | Tài khoản phụ huynh do trung tâm/admin tạo hoặc mời (không tự đăng ký công khai). | Nếu cho tự đăng ký → cần thêm luồng xác minh quan hệ cha mẹ–con. |
| A5 | Tiền tệ VND, múi giờ Asia/Ho_Chi_Minh, giao diện tiếng Việt. | — |
| A6 | Chưa có số liệu baseline; các chỉ tiêu dưới đây là **giả thuyết**, cần đo baseline trong 2 tuần đầu. | Chỉ tiêu có thể phải hiệu chỉnh. |

## 2. Problem Statement
Phụ huynh (thường bận đi làm) không có nơi tập trung để biết **khi nào con học, con học tiến bộ ra sao, và đã đóng học phí chưa**. Thông tin rải rác trên tin nhắn khiến phụ huynh hỏi lại nhiều lần, gia sư/admin tốn thời gian trả lời, nhầm lịch/bỏ buổi và trễ hạn học phí. Không giải quyết → giảm sự tin tưởng, tăng tỷ lệ phụ huynh ngừng thuê gia sư.

## 3. Brainstorm (theo skill `product-brainstorming`)
**JTBD:** *Khi tôi bận đi làm, tôi muốn liếc nhanh trên điện thoại để biết lịch học, tình hình học và học phí của con, để tôi yên tâm và không phải nhắn hỏi gia sư.*

**How Might We**
- HMW giúp phụ huynh biết lịch học tuần này của con trong < 10 giây?
- HMW cho phụ huynh thấy con tiến bộ mà không bắt gia sư viết báo cáo dài?
- HMW giảm số lần phụ huynh hỏi “tháng này đóng bao nhiêu?”

**Phương án đã cân nhắc**

| Phương án | Nhận xét | Quyết định |
|---|---|---|
| Cổng web read-only (lịch, nhận xét, học phí) | Rẻ, giải quyết đúng JTBD | ✅ Chọn cho MVP |
| Chỉ gửi tin nhắn Zalo/SMS tự động, không có cổng | Rẻ nhất nhưng không “một nơi”, khó tra lịch sử | Giữ ý tưởng cho thông báo (P1/P2) |
| App native iOS/Android | Trải nghiệm tốt, chi phí cao | ❌ Won't (v1) |
| Thanh toán online trong cổng | Giá trị cao nhưng phụ thuộc cổng thanh toán, pháp lý | ❌ Won't (v1), đưa vào Later |
| Chat phụ huynh–gia sư | Trùng Zalo, tăng tải gia sư | ❌ Won't (v1) |

**Giả định rủi ro nhất:** gia sư/admin có nhập nhận xét buổi học đều đặn không? → Thí nghiệm rẻ: form nhận xét ≤ 3 trường, đo tỷ lệ buổi có nhận xét trong 2 tuần pilot.

## 4. Goals (đo được)
| # | Mục tiêu | Chỉ số | Mục tiêu (giả thuyết) | Thời điểm đo |
|---|---|---|---|---|
| G1 | Phụ huynh chủ động dùng cổng | % phụ huynh được mời đã kích hoạt tài khoản | ≥ 60% (stretch 80%) | 30 ngày sau go-live |
| G2 | Cổng trở thành thói quen | % phụ huynh đã kích hoạt truy cập ≥ 1 lần/tuần (WAU) | ≥ 40% | 60 ngày |
| G3 | Giảm tải hỏi đáp cho gia sư/admin | Số tin nhắn/cuộc gọi hỏi lịch & học phí / tuần | Giảm ≥ 30% so với baseline | 60 ngày |
| G4 | Thu học phí đúng hạn | % hoá đơn thanh toán trước/đúng hạn | Tăng ≥ 15 điểm % so với baseline | 1 quý |
| G5 | Minh bạch tiến độ | % buổi học có nhận xét hiển thị cho phụ huynh | ≥ 80% | 30 ngày |

## 5. Non-Goals (v1)
- **Thanh toán online** — phụ thuộc tích hợp cổng thanh toán & đối soát; v1 chỉ hiển thị trạng thái + thông tin chuyển khoản.
- **Chat/nhắn tin trong cổng** — phụ huynh đã dùng Zalo; tránh tăng tải cho gia sư.
- **Phụ huynh tự đặt/đổi lịch học** — cần quy trình xác nhận với gia sư; để epic sau.
- **App native** — web responsive đủ cho MVP.
- **Phía nhập liệu cho gia sư/admin** — thuộc epic quản trị riêng (xem phụ thuộc D1).

## 6. User Stories & ưu tiên MoSCoW
Persona: **Phụ huynh** (chính), Admin trung tâm (phụ, chỉ cho phần mời tài khoản).

| ID | Story | MoSCoW | Ước lượng | Phụ thuộc |
|---|---|---|---|---|
| S1 | Đăng nhập & xem danh sách con được liên kết | Must | 3–4 ngày | D1 (dữ liệu học sinh) |
| S2 | Xem lịch học sắp tới của con | Must | 2–3 ngày | S1 |
| S3 | Xem nhận xét từng buổi học | Must | 2–3 ngày | S1 |
| S4 | Xem học phí & trạng thái thanh toán | Must | 3 ngày | S1 |
| S5 | Trang tổng quan “một nơi” | Should | 2 ngày | S2, S3, S4 |
| S6 | Thông báo khi lịch học thay đổi/huỷ | Should | 2–3 ngày | S2 |
| S7 | Nhắc học phí sắp đến hạn/quá hạn | Should | 2 ngày | S4 |
| S8 | Biểu đồ tiến độ theo môn/kỹ năng | Could | 3–4 ngày | S3 |

**Won't (v1):** thanh toán online, chat, tự đặt lịch, app native.

### Tiêu chí chấp nhận (tóm tắt — BA sẽ chi tiết hoá ở Analysis)
**S1 – Đăng nhập & liên kết con**
- Given admin đã mời phụ huynh bằng SĐT/email, When phụ huynh kích hoạt và đăng nhập, Then thấy đúng danh sách con được liên kết.
- Phụ huynh **không** xem được dữ liệu của học sinh không liên kết với mình (kiểm thử phân quyền bắt buộc).
- Có chuyển đổi giữa các con khi có ≥ 2 con. Sai mật khẩu/OTP hiển thị lỗi rõ ràng.

**S2 – Lịch học**
- Hiển thị các buổi trong 14 ngày tới: ngày, giờ (Asia/Ho_Chi_Minh), môn, gia sư, hình thức/địa điểm, trạng thái (đã lên lịch/đã huỷ/đã dời).
- Trạng thái rỗng: “Chưa có buổi học nào trong 2 tuần tới”.

**S3 – Nhận xét buổi học**
- Mỗi buổi đã diễn ra hiển thị: có mặt/vắng, nội dung đã học, nhận xét, bài tập về nhà (nếu có).
- Danh sách sắp xếp mới nhất trước; buổi chưa có nhận xét ghi “Gia sư chưa cập nhật”.

**S4 – Học phí**
- Hiển thị từng kỳ/hoá đơn: kỳ, số buổi, đơn giá, tổng tiền (VND), hạn đóng, trạng thái (chưa đóng/đã đóng/quá hạn).
- Hiển thị thông tin chuyển khoản và nội dung chuyển khoản gợi ý. Tổng công nợ hiện tại đúng bằng tổng các hoá đơn chưa đóng.

**S5 – Tổng quan**
- Một màn hình: buổi học kế tiếp, nhận xét mới nhất, công nợ hiện tại; mỗi khối dẫn sang màn chi tiết.
- Tải xong trong ≤ 2 giây trên mạng 4G (p75).

**S6 – Thông báo đổi lịch**
- Khi buổi học bị huỷ/dời, phụ huynh liên kết nhận thông báo (email hoặc kênh được cấu hình) trong ≤ 15 phút, nội dung gồm giờ cũ → giờ mới.

**S7 – Nhắc học phí**
- Gửi nhắc 3 ngày trước hạn và 1 ngày sau khi quá hạn; không gửi cho hoá đơn đã đóng.

**S8 – Tiến độ theo môn**
- Hiển thị số buổi đã học/vắng và xu hướng đánh giá theo môn trong 3 tháng gần nhất.

## 7. Success Metrics
- **Leading:** tỷ lệ kích hoạt (G1), WAU (G2), tỷ lệ buổi có nhận xét (G5), thời gian tải tổng quan.
- **Lagging:** giảm tin nhắn hỏi đáp (G3), thu học phí đúng hạn (G4), tỷ lệ phụ huynh tiếp tục gói học sau 3 tháng.
- **Cách đo:** event analytics (login, xem màn hình), dữ liệu hoá đơn; G3 cần admin đếm thủ công baseline 2 tuần trước go-live.

## 8. Rủi ro & phụ thuộc
| ID | Rủi ro / phụ thuộc | Mức | Giảm thiểu |
|---|---|---|---|
| D1 | Chưa có phía quản trị/gia sư để nhập học sinh, lịch, nhận xét, học phí | Cao | Tạo epic “Quản trị trung tâm” song song; tạm dùng seed/import CSV để demo |
| R1 | Gia sư không nhập nhận xét đều đặn → S3/S8 rỗng | Cao | Form nhận xét tối giản; đo G5 trong pilot |
| R2 | Lộ dữ liệu trẻ em (PII) giữa các phụ huynh | Cao | Kiểm thử phân quyền bắt buộc ở S1; tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (cần pháp chế xác nhận) |
| R3 | Kênh thông báo (Zalo ZNS/SMS) tốn phí | TB | v1 dùng email/web; đánh giá Zalo ZNS ở Next |

## 9. Open Questions
| Câu hỏi | Người trả lời | Chặn? |
|---|---|---|
| Đăng nhập bằng SĐT + OTP hay email + mật khẩu? | Owner / TechLead | Chặn S1 |
| Stack kỹ thuật & nơi lưu dữ liệu? (repo chưa có code) | TechLead | Chặn S1 |
| Học phí tính theo buổi hay theo gói tháng? | Owner | Chặn S4 |
| Kênh thông báo ưu tiên: email, Zalo, SMS? | Owner | Không chặn MVP |
| Yêu cầu pháp lý về dữ liệu học sinh dưới 16 tuổi? | Pháp chế | Không chặn dev, chặn go-live |

## 10. Timeline / Phasing
- **Phase 1 (MVP, Must):** S1 → S2, S3, S4 (S2–S4 làm song song sau S1). ~10–13 ngày công.
- **Phase 2 (Should):** S5, S6, S7. ~6–7 ngày công.
- **Phase 3 (Could):** S8.
- Xem `docs/product/ROADMAP.md`.
