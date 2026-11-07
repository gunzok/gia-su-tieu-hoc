## Thay đổi gì và vì sao
<!-- 1-3 dòng, tiếng Việt. Ghi mã ticket nếu có (GSTH-xxx). -->

## Cách thử
<!-- Ví dụ: mở màn Hỏi cô, bấm nút mic, thấy ... -->

## Kiểm tra
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npm test` đều sạch (CI cũng chạy lại)
- [ ] Không có khoá bí mật trong code (API key chỉ ở Supabase secrets / `.env.local`)
- [ ] Nếu đổi thư viện native, plugin, quyền hoặc `app.json`: đã nâng version (`npm run version:set -- x.y.z`) vì cần build lại, không đi OTA được
- [ ] Nếu đổi `supabase/`: migration mới có RLS, đã đọc dry-run trước khi gộp
