-- GIA-77: ghi loại khoá Gemini đã dùng cho mỗi lượt, để theo dõi chi phí gói trả phí.
--   'free' = khoá GEMINI_API_KEY (gói miễn phí của Gemini), 'paid' = khoá GEMINI_API_KEY_TRA_PHI (bật thanh toán).
--   null  = lượt không dùng Gemini (Claude) hoặc ghi trước GIA-77.
-- Hai bảng đã bật RLS và chỉ có chính sách select cho chủ tài khoản; chỉ máy chủ (service role) ghi cột này,
-- nên không cần thêm chính sách. Thêm cột cho phép null, không giá trị mặc định: không viết lại bảng, không khoá lâu.

alter table public.grading_usage
  add column gemini_key text check (gemini_key in ('free', 'paid'));

alter table public.ai_usage_log
  add column gemini_key text check (gemini_key in ('free', 'paid'));

comment on column public.grading_usage.gemini_key is 'Loại khoá Gemini đã chấm lượt này: free / paid; null nếu không dùng Gemini (GIA-77).';
comment on column public.ai_usage_log.gemini_key is 'Loại khoá Gemini đã dùng: free / paid; null nếu không dùng Gemini (GIA-77).';
