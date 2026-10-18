-- Lưu ảnh bài làm (nhiều trang) cho từng lần chấm, gắn với bé, để ba mẹ tra cứu lại theo môn.

-- Mỗi bài chấm thuộc về một bé (hiện mỗi tài khoản một bé, để sẵn cho nhiều bé sau này).
alter table public.gradings
  add column child_id uuid references public.children (id) on delete set null,
  -- Đường dẫn ảnh trong kho "bai-lam", theo thứ tự trang: {owner_id}/{local_id}/1.jpg …
  add column image_paths text[] not null default '{}',
  -- Bài được chấm bằng gì: 'claude' (máy chủ) hay 'local' (LM Studio ở nhà).
  add column engine text check (engine in ('claude', 'local'));

create index gradings_owner_subject_created_idx
  on public.gradings (owner_id, subject, created_at desc);

-- Cho phép cập nhật bài chấm (gắn ảnh sau khi tải lên xong).
create policy "Chỉ chủ tài khoản sửa bài chấm" on public.gradings
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Kho ảnh riêng tư: không ai xem được nếu không đăng nhập đúng tài khoản.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bai-lam', 'bai-lam', false, 5242880, array['image/jpeg']);

-- Mỗi tài khoản chỉ đọc/ghi/xoá ảnh trong thư mục mang id của mình.
create policy "Xem ảnh bài làm của mình" on storage.objects
  for select to authenticated
  using (bucket_id = 'bai-lam' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Tải lên ảnh bài làm của mình" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bai-lam' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Xoá ảnh bài làm của mình" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bai-lam' and (storage.foldername(name))[1] = (select auth.uid()::text));
