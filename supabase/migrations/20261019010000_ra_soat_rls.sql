-- Rà soát quyền (RLS) trước khi lên store: mỗi tài khoản chỉ đọc/ghi dữ liệu của mình.
-- Các bảng children, gradings và kho ảnh "bai-lam" đã chặn theo owner_id / thư mục id tài khoản;
-- migration này vá hai chỗ còn hở.

-- 1. Bài chấm chỉ được gắn với bé của chính tài khoản đó (child_id không trỏ sang bé nhà khác).
drop policy "Chỉ chủ tài khoản thêm bài chấm" on public.gradings;
drop policy "Chỉ chủ tài khoản sửa bài chấm" on public.gradings;

create policy "Chỉ chủ tài khoản thêm bài chấm" on public.gradings
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (
      child_id is null
      or exists (select 1 from public.children c where c.id = child_id and c.owner_id = (select auth.uid()))
    )
  );
create policy "Chỉ chủ tài khoản sửa bài chấm" on public.gradings
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (
      child_id is null
      or exists (select 1 from public.children c where c.id = child_id and c.owner_id = (select auth.uid()))
    )
  );

-- 2. App tải ảnh với upsert (ghi đè khi tải lại), việc này cần quyền update trong thư mục của mình.
create policy "Ghi đè ảnh bài làm của mình" on storage.objects
  for update to authenticated
  using (bucket_id = 'bai-lam' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'bai-lam' and (storage.foldername(name))[1] = (select auth.uid()::text));
