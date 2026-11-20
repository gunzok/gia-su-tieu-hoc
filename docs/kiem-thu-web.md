# Kiểm thử bản web và chạy thử với 10 người (GIA-73)

Web production: https://gia-su-tieu-hoc.giasutieuhoc.workers.dev · Lần chạy gần nhất: **19/11/2026** (QA, Playwright 1.65 + axe-core 4.10,
bản đang chạy sau PR #40). Kịch bản tự động ở mục 6; ảnh chụp trong `docs/kiem-thu-web-anh/`.

Ký hiệu: ✅ Đạt · ❌ Lỗi (kèm ticket) · ⚠️ Đạt nhưng có lỗi nhỏ (kèm ticket) · ⏳ Chưa thử (lý do ở mục 3).

## 1. Thiết bị / trình duyệt đã chạy

| Cột | Cách giả lập | Cỡ khung |
|---|---|---|
| Chrome | Google Chrome cài trên máy (Playwright `channel: chrome`) | 1280×800 |
| Safari (Mac) | WebKit của Playwright (cùng nhân Safari) | 1280×800 |
| Firefox | Firefox của Playwright | ⏳ không mở được trên máy này (lỗi "Could not find profile folder", giống lần thử 10/11) |
| iPhone Safari | WebKit + hồ sơ "iPhone 13" (chạm, tỉ lệ 3x) | 390×664 |
| iPad Safari | WebKit + hồ sơ "iPad (gen 7)" | 810×1080 |
| Android Chrome | Chrome + hồ sơ "Pixel 7" | 412×839 |
| Máy gập mở | Chrome, chạm, 2x | 884×1104 |
| Máy gập gập (màn ngoài) | Chrome, chạm, 3x (cỡ Galaxy Z Fold màn ngoài, ~ phóng 400% của 1280px) | 344×882 |

Không có máy thật: các cột iPhone / iPad / Android / máy gập là **giả lập viewport**, chưa phải Safari iOS hay Chrome Android thật.

## 2. Bảng kết quả theo trình duyệt

| Màn / việc | Chrome | Safari (Mac) | Firefox | iPhone Safari | iPad Safari | Android Chrome | Máy gập mở | Máy gập gập |
|---|---|---|---|---|---|---|---|---|
| Hộp đồng ý hiện lần đầu; đồng ý xong tải lại không hiện | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trang chủ (Khởi động, chưa có hồ sơ) | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo hồ sơ bé → vào Trang chủ | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trang chủ (4 tab, có hồ sơ) | ⚠️ GIA-87, GIA-89 | ⚠️ | ⏳ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Quét bài: chọn ảnh mở hộp chọn tệp, ảnh hiện, nút chấm hiện | ⚠️ GIA-87, GIA-90 | ⚠️ | ⏳ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Quét bài: bấm chấm khi chưa đăng nhập bằng email được mời | ✅ báo "Chưa chấm được bài… đăng nhập" | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Chữa bài (chưa có bài) | ⚠️ GIA-87 | ⚠️ | ⏳ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Tiến độ (chưa có bài, thấy "Xoá tài khoản & dữ liệu") | ⚠️ GIA-87 | ⚠️ | ⏳ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Đăng nhập: mở được, email sai định dạng bị chặn | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tải app | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chính sách, Điều khoản | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trang không tồn tại | ❌ GIA-88 | ❌ | ⏳ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Không cuộn ngang (mọi màn trên) | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Không lỗi JS / console | ✅ | ✅ | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ |

Ghi chú: lỗi console duy nhất là `403` khi bấm chấm bằng tài khoản ẩn danh (đúng: máy chủ chỉ nhận email được mời).

### Việc cần người thật (⏳ ở mọi cột)

| Việc | Vì sao chưa thử |
|---|---|
| Đăng nhập email (mã 8 số) đến cuối, tải lại vẫn còn phiên | cần hộp thư được mời; không dùng email thật của người khác |
| Đăng nhập Google đến cuối | cần tài khoản Google được mời |
| Chấm bài 1 trang / nhiều trang, kết quả ở Chữa bài, Hỏi cô, nghe cô đọc | máy chủ chỉ cho email được mời (`WEB_CHI_NGUOI_DUOC_MOI`); hạn chế gọi AI thật |
| Hết 3 lượt/ngày: lời báo thân thiện, số lượt còn lại đúng | như trên |
| Chụp bằng webcam / camera điện thoại thật | trình duyệt tự động không có camera thật |
| Đăng xuất, xoá tài khoản | cần tài khoản thật |
| Safari iOS, Chrome Android, máy gập **thật**; Firefox | không có máy; Firefox của Playwright không chạy trên máy này |

10 người thử (mục 5) phủ phần này; QA ghi kết quả về bảng 2 khi có phản hồi.

## 3. Truy cập (accessibility), robots, tiêu đề

| Kiểm tra | Kết quả |
|---|---|
| axe-core WCAG 2 A/AA (gồm tương phản màu) trên 12 màn × 7 khung | ✅ 0 lỗi, trừ Quét bài có ảnh: 2 lỗi `image-alt` → **GIA-90** |
| Bàn phím: Tab đi qua nút theo thứ tự hợp lý, có viền khi chọn | ✅ hộp đồng ý, Khởi động, Trang chủ (Nghe cô dặn → Chấm bài → Chọn ảnh → môn học → Góc phụ huynh → chân trang → thanh trên → tab). Hộp đồng ý giữ Tab bên trong hộp |
| Vùng bấm ≥ 44px | ⚠️ "Cổng phụ huynh" cao 36px (mọi màn có thanh trên), nút X "Bỏ trang" 24×24 → **GIA-87**. Nút "Bỏ qua" màn Đăng nhập (64×34 hôm 10/11) đã đạt |
| Khung hẹp 344px (tương đương phóng 400%) không vỡ, không cuộn ngang | ✅ |
| `robots.txt` | ✅ `Allow: /` (GIA-78). Chưa có dòng `Sitemap:`; `/sitemap.xml` trả trang app mã 200 → ghi trong **GIA-88** |
| Header | ✅ HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`; không còn `X-Robots-Tag: noindex` |
| `<html lang="vi">`, `meta description` | ✅ |
| Tiêu đề trang | ⚠️ Khởi động, Đăng nhập, Hồ sơ có tiêu đề riêng; các màn khác chỉ "Gia sư Tiểu học", Trang chủ giữ tiêu đề cũ "Hồ sơ của bé" → **GIA-89** |
| Phóng to chữ 200% của trình duyệt | ⏳ người thử làm tay (Playwright không giả lập được cỡ chữ hệ thống) |

## 4. Lỗi đã tạo ticket (con của GIA-73, project Web app, nhãn `Bug` + `Web`)

| Ticket | Mức | Tóm tắt |
|---|---|---|
| [GIA-87](https://linear.app/justintran/issue/GIA-87) | Vừa | Vùng bấm < 44px: "Cổng phụ huynh" (36px cao), X "Bỏ trang" (24×24) |
| [GIA-88](https://linear.app/justintran/issue/GIA-88) | Nhẹ | Trang không tồn tại: màn "Unmatched Route" tiếng Anh, lộ `/_sitemap`; đường dẫn sai trả 200 |
| [GIA-89](https://linear.app/justintran/issue/GIA-89) | Nhẹ | Tiêu đề tab không đổi theo màn, Trang chủ giữ "Hồ sơ của bé" |
| [GIA-90](https://linear.app/justintran/issue/GIA-90) | Nhẹ | Ảnh trang bài làm ở Quét bài thiếu `alt` |

Không thấy lỗi nặng (không vào được, trắng trang, mất dữ liệu) ở phần thử được.

**Kiểm lại sau khi sửa (19/11, nhánh `web/GIA-87`, bản build chạy trên máy, Chrome + Android Chrome + Safari + iPhone Safari):**
cả 4 lỗi đạt. Nút X "Bỏ trang" 44×44 (hình tròn 28px bên trong), "Cổng phụ huynh" 168×44 / 52×44 (đã sửa ở PR #43);
trang 404 tiếng Việt có nút "Về Trang chủ", `/_sitemap` cũng hiện trang này, kèm `noindex`; mỗi màn một tiêu đề
(đặt theo đường dẫn ở `src/web/page-title.ts`); ảnh xem trước có `alt="Trang 1 bài làm của bé"`. axe 0 lỗi ở Trang chủ,
Quét bài có ảnh, 404. Ảnh: `gia-87-nut-bo-trang-truoc.jpg` / `-sau.jpg`, `gia-88-404-chrome-desktop.jpg`, `gia-88-404-iphone-safari.jpg`.
Đường dẫn sai vẫn trả mã 200 (Cloudflare chế độ SPA); muốn trả 404 thật phải đổi cấu hình Worker (ngoài phạm vi GIA-88).

## 5. Chạy thử với 10 người

Bộ tài liệu trong `docs/nguoi-thu-web/` (chủ dự án gửi, QA không gửi cho ai):
- [`thu-moi.md`](nguoi-thu-web/thu-moi.md): thư mời ngắn.
- [`huong-dan-1-trang.md`](nguoi-thu-web/huong-dan-1-trang.md): hướng dẫn 1 trang + 5 câu hỏi sau 1 tuần.
- [`mau-ghi-loi.md`](nguoi-thu-web/mau-ghi-loi.md): mẫu ghi lỗi, cách chấm mức độ.

Trước khi mời (chủ dự án / DevOps):
1. Thêm email người thử vào `moi_dung_thu` (SQL ở `docs/trien-khai-web.md`), hoặc tắt `WEB_CHI_NGUOI_DUOC_MOI` nếu đã mở web.
2. Supabase Auth: Site URL và Redirect URLs gồm `<địa chỉ web>/**` để đăng nhập email/Google quay về đúng web.
3. Kiểm `GIOI_HAN_CHUNG_NGAY`, `GIOI_HAN_TONG_NGAY` đủ cho 10 người × 3 lượt/ngày; budget alert AI (GIA-72).
4. Nên sửa GIA-87 trước (vùng bấm cho trẻ).

**Tiêu chí quyết định mở rộng (sau 1 tuần, chủ dự án quyết):**
- Không còn lỗi Nặng (không đăng nhập được, không chấm được, mất dữ liệu, lộ dữ liệu người khác).
- Chi phí AI trong ngưỡng (GIA-72).
- Ba mẹ thấy bé tự dùng được, lời nhận xét dễ hiểu (câu 1–2 của phiếu hỏi).

## 6. Chạy lại kịch bản tự động

Kịch bản không nằm trong repo (không thêm phụ thuộc vào `package.json`, không đụng CI). Cách chạy lại:

```bash
mkdir -p /tmp/kiem-thu-web && cd /tmp/kiem-thu-web && npm init -y
npm i playwright@1.65.0 @axe-core/playwright@4.10.2
npx playwright install webkit firefox   # Chrome dùng bản cài trên máy
# run.mjs: mở web → đồng ý → Khởi động, Chính sách, Điều khoản, Tải app, Đăng nhập (email sai)
#          → tạo hồ sơ bé → 4 tab → chọn 1 ảnh ở Quét bài → Tiến độ → trang 404;
#          mỗi màn: tiêu đề, cuộn ngang, axe WCAG 2 A/AA, vùng bấm < 44px, đi Tab, ảnh chụp.
node run.mjs chromium   # chrome-desktop, android-chrome, may-gap, may-gap-dong
node run.mjs webkit     # safari-desktop, iphone-safari, ipad-safari
```

Bản `run.mjs` dùng ngày 19/11 đính kèm ở comment "Worker xong" của GIA-73 trên Linear.
