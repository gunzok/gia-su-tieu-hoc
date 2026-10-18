-- Nhật ký lượt chấm bằng Claude, để giới hạn số lần chấm mỗi ngày (Miễn phí 3, Plus 50).
-- Chỉ hàm "cham-bai" (dùng service role) được ghi/xoá; app chỉ xem được lượt của mình,
-- nên xoá lịch sử bài chấm không làm "hồi" lại lượt.

create table public.grading_usage (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  pages smallint not null check (pages between 1 and 6),
  created_at timestamptz not null default now()
);

create index grading_usage_owner_created_idx on public.grading_usage (owner_id, created_at desc);

alter table public.grading_usage enable row level security;

-- Không có chính sách insert/update/delete: người dùng không tự sửa được lượt.
create policy "Chỉ chủ tài khoản xem lượt chấm" on public.grading_usage
  for select to authenticated using ((select auth.uid()) = owner_id);
