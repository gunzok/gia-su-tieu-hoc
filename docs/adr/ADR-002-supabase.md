# ADR-002: Supabase làm máy chủ

- **Trạng thái**: Đã chấp nhận (ghi hồi tố 2026-11-13)
- **Ngày**: 2026-10-18
- **Người quyết định**: chủ dự án

## Bối cảnh
Cần đăng nhập, lưu hồ sơ bé và lịch sử chấm, lưu ảnh bài làm, và một nơi giữ khoá AI (không được để trong app).

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Supabase | Auth + Postgres (RLS) + Storage + Edge Functions một chỗ, có MCP/CLI | Edge Functions chạy Deno; gói miễn phí có giới hạn |
| Firebase | Phổ biến với mobile | NoSQL, quy tắc bảo mật khó kiểm thử hơn |
| Tự dựng API (Node) | Toàn quyền | Phải tự vận hành máy chủ, bảo mật |

## Quyết định
Supabase dự án `ssdotdqxdzxphrkxdxux`. Mọi bảng bật RLS; lời gọi AI đi qua Edge Functions (`cham-bai`, `hoi-co`, `doc-loi`,
`xoa-tai-khoan`); khoá AI chỉ nằm ở Supabase secrets. Migration trong `supabase/migrations/`, deploy bằng `CD - Supabase` có duyệt.

## Hệ quả
- Dễ hơn: phân quyền theo người dùng ngay trong DB; deploy hàm và migration qua CI.
- Khó hơn: CLI phải nhắm `--remote`; đăng nhập ẩn danh (app cần) mở đường tạo nhiều tài khoản.

## Điều kiện xem xét lại
Khi vượt giới hạn gói, hoặc cần lưu dữ liệu trẻ em ở vùng/nhà cung cấp khác vì pháp lý.

## Nguồn tham khảo
- `docs/supabase.md`
