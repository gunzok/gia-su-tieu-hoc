-- Danh sách mời dùng thử bản web (GIA-69).
-- Khi secret WEB_CHI_NGUOI_DUOC_MOI=true, các hàm cham-bai / hoi-co / doc-loi chỉ nhận người dùng
-- đăng nhập thật có email nằm trong bảng này (khi gọi từ trình duyệt). App điện thoại không bị ảnh hưởng.
--
-- Thêm người:  insert into public.moi_dung_thu (email, ghi_chu) values ('ba.me@gmail.com', 'nhà bạn A');
-- Bớt người:   delete from public.moi_dung_thu where email = 'ba.me@gmail.com';
-- (chạy trong Supabase → SQL Editor, hoặc sửa bảng trong Table Editor; nhớ viết email chữ thường)

create table public.moi_dung_thu (
  email text primary key check (email = lower(email)),
  ghi_chu text,
  created_at timestamptz not null default now()
);

alter table public.moi_dung_thu enable row level security;
-- Không có policy: chỉ máy chủ (service role) và người quản trị trong dashboard đọc/ghi được.

-- Để màn đăng nhập web báo lịch sự "chưa được mời": tài khoản đang đăng nhập hỏi xem mình có trong danh sách không.
create function public.duoc_moi()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.moi_dung_thu
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.duoc_moi() from public, anon;
grant execute on function public.duoc_moi() to authenticated;
