<!-- Tiêu đề PR = commit trên main (chỉ squash): `type(GIA-xx): mô tả tiếng Việt`
     type: feat · fix · docs · chore · refactor · test · ci · perf -->

## Liên kết
- Ticket Linear: GIA-

## Thay đổi gì và vì sao
<!-- 1-3 dòng. -->

## Cách thử
1.

## Ảnh chụp (nếu đổi giao diện)

## Definition of Done
- [ ] Tiêu chí nghiệm thu của ticket đã đạt và có test (nếu là logic)
- [ ] `make check` sạch (lint, typecheck, test); CI cũng chạy lại
- [ ] Không có khoá bí mật trong code (khoá chỉ ở Supabase secrets / GitHub secrets / `.env.local`)
- [ ] Giao diện khớp mẫu đã duyệt, đủ trạng thái rỗng / đang tải / lỗi (nếu đổi giao diện)
- [ ] Đổi thư viện native, plugin, quyền hoặc `app.json`: đã nâng version (`npm run version:set -- x.y.z`), không đi OTA được
- [ ] Đổi `supabase/`: migration mới có RLS; đọc dry-run trước khi duyệt deploy
- [ ] Đổi quyết định lớn: thêm ADR trong `docs/adr/`; đổi rủi ro hay gate: cập nhật `PROJECT_STATE.md`
- [ ] Ticket Linear đã comment tóm tắt và chuyển `In Review`
