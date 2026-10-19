# GSTH-001 – Hướng dẫn dựng môi trường test cho QA

Trang FAQ tĩnh `/faq` (HTML/CSS/JS thuần, không build step, không database, không migration).

## 1. Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| Node.js | ≥ 20 (CI dùng 22) |
| Trình duyệt E2E | Chromium do Playwright 1.56.1 tải về |

## 2. Dựng môi trường

```bash
git fetch origin
git checkout agent/gsth-001
npm ci
npx playwright install chromium   # chỉ cần cho npm test (E2E)
npm start                         # http://127.0.0.1:8080/faq
```

## 3. Biến môi trường

| Biến | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `PORT` | Không | `8080` | Cổng server dev (`scripts/serve.js`), chỉ lắng nghe `127.0.0.1` |

Không có secret, API key hay cấu hình nào khác.

## 4. Kiểm tra tự động

```bash
npm run lint        # ESLint
npm run test:unit   # 13 unit test (node:test)
npm run test:e2e    # 13 E2E (Playwright, viewport 375px và 1280px)
```

CI (`.github/workflows/ci.yml`) chạy cùng các bước trên cho mỗi push lên `agent/**` và mỗi PR vào `main`.

## 5. Kiểm thử thủ công

- Spec và AC: `docs/specs/GSTH-001-faq-phu-huynh.md` (AC1–AC10, E1–E12).
- Kiểm tra 375px: DevTools → Device toolbar → chiều rộng 375 (hoặc iPhone SE).
- Điện thoại thật không truy cập được server dev vì server chỉ lắng nghe `127.0.0.1`; dùng chế độ mô phỏng thiết bị của DevTools.

## 6. Lưu ý khi test

- Chưa có môi trường preview/staging: repo không có cấu hình deploy, QA test trên máy local.
- 10 câu trả lời còn placeholder `[PO cập nhật]`: không phải lỗi QA, nhưng **chặn phát hành** (spec Q2).
- Font Be Vietnam Pro tải từ Google Fonts: offline vẫn hiển thị bằng font dự phòng.
- Server dev (`npm start`) chỉ để test local, không dùng cho production (TechLead M1, M2).
