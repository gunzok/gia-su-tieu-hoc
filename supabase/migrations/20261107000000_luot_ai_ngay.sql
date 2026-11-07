-- Giới hạn lượt dùng AI mỗi ngày cho bản web (GIA-68):
--  * ai_usage_log: lượt "Hỏi cô" (hoi-co) và tạo giọng đọc mới (doc-loi), cùng kiểu với grading_usage.
--  * chỉ mục theo ngày của grading_usage để đếm tổng lượt toàn hệ thống nhanh (cầu dao chung).

create table public.ai_usage_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('hoi-co', 'doc-loi')),
  created_at timestamptz not null default now()
);

create index ai_usage_log_owner_kind_created_idx on public.ai_usage_log (owner_id, kind, created_at desc);

alter table public.ai_usage_log enable row level security;

-- Chỉ máy chủ (service role) ghi/xoá; người dùng chỉ xem được lượt của mình.
create policy "Chỉ chủ tài khoản xem lượt dùng AI" on public.ai_usage_log
  for select to authenticated using ((select auth.uid()) = owner_id);

create index grading_usage_created_idx on public.grading_usage (created_at desc);
