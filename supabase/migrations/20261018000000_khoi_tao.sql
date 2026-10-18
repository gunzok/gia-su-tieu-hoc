-- Bảng dữ liệu của app Gia sư tiểu học.
-- Mỗi tài khoản (ba mẹ, hoặc máy chưa đăng nhập dùng tài khoản ẩn danh) chỉ thấy dữ liệu của mình.
-- Không lưu ảnh bài làm của bé lên máy chủ.

create table public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 40),
  grade smallint not null check (grade between 1 and 5),
  avatar text not null default 'be-trai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- App hiện chỉ quản lý một bé cho mỗi tài khoản.
  unique (owner_id)
);

create table public.gradings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Mã bài chấm do app tạo, để đồng bộ không bị trùng.
  local_id text not null,
  subject text not null check (subject in ('toan', 'tieng-viet')),
  grade smallint not null check (grade between 1 and 5),
  score numeric(3, 1) not null check (score between 0 and 10),
  spoken_feedback text not null,
  parent_note text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_id, local_id)
);

create index gradings_owner_created_idx on public.gradings (owner_id, created_at desc);

alter table public.children enable row level security;
alter table public.gradings enable row level security;

create policy "Chỉ chủ tài khoản xem hồ sơ bé" on public.children
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Chỉ chủ tài khoản tạo hồ sơ bé" on public.children
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Chỉ chủ tài khoản sửa hồ sơ bé" on public.children
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Chỉ chủ tài khoản xoá hồ sơ bé" on public.children
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Chỉ chủ tài khoản xem bài chấm" on public.gradings
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Chỉ chủ tài khoản thêm bài chấm" on public.gradings
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Chỉ chủ tài khoản xoá bài chấm" on public.gradings
  for delete to authenticated using ((select auth.uid()) = owner_id);
