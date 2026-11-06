-- GIA-56: bài chấm bằng Gemini không lưu được vì ràng buộc chỉ cho 'claude' và 'local'.
alter table public.gradings drop constraint gradings_engine_check;
alter table public.gradings
  add constraint gradings_engine_check check (engine in ('claude', 'gemini', 'local'));
