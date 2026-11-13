# ADR-001: Expo + expo-router, một mã nguồn cho iOS, Android và web

- **Trạng thái**: Đã chấp nhận (ghi hồi tố 2026-11-13)
- **Ngày**: 2026-10-18 (app) · 2026-11-06 (thêm web)
- **Người quyết định**: chủ dự án

## Bối cảnh
App cho học sinh lớp 1-5 và phụ huynh: chụp bài, AI chấm, đọc nhận xét bằng giọng Việt. Một người làm chính, có agent hỗ trợ;
cần ra iOS, Android, sau đó thêm bản web cho máy tính.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Expo (React Native) + expo-router | Một mã nguồn, OTA qua EAS Update, có web | Module native phải kiểm tra trên từng nền tảng |
| Swift + Kotlin riêng | Hiệu năng, API mới nhất | Gấp đôi công sức, không có web |
| Flutter | Một mã nguồn | Đội và agent quen TypeScript hơn; tích hợp Supabase/Expo kém tiện |

## Quyết định
Expo SDK 58 + expo-router, TypeScript. Web dùng chung `src/lib/` (logic), giao diện riêng ở `src/web/` và file `*.web.tsx`.

## Hệ quả
- Dễ hơn: sửa logic một lần cho cả ba nền tảng; OTA cho thay đổi JS.
- Khó hơn: module native (quét trang, mic) không có trên web, cần bản `.web.ts` thay thế; đổi native phải nâng version và build lại.

## Điều kiện xem xét lại
Khi cần tính năng native mà Expo không hỗ trợ, hoặc web cần SEO/SSR nặng.

## Nguồn tham khảo
- `AGENTS.md` (mục Tách Mobile / Web), `docs/webapp.md`
