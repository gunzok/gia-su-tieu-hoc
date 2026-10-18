-- Bé học cùng Cô giáo ('co', mặc định) hay Thầy giáo ('thay', chỉ gói Plus).
alter table public.children
  add column teacher text not null default 'co' check (teacher in ('co', 'thay'));
