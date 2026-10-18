-- Đếm số ký tự đã gửi Google để tạo giọng đọc, theo từng tháng (giờ UTC, dạng '2026-10').
-- Hàm "doc-loi" dùng để ngừng gọi Google khi gần hết 1 triệu ký tự miễn phí mỗi tháng.
-- Chỉ máy chủ (khoá service role) đọc/ghi; app không truy cập được.
create table public.giong_doc_thang (
  thang text primary key,
  so_ky_tu bigint not null default 0,
  cap_nhat timestamptz not null default now()
);

alter table public.giong_doc_thang enable row level security;
-- Không tạo policy nào: tài khoản thường không đọc/ghi được, chỉ service role.

-- Cộng thêm ký tự cho tháng (tạo dòng nếu chưa có), trả về tổng mới. Cộng nguyên tử, không lệch khi nhiều máy gọi cùng lúc.
create function public.cong_ky_tu_giong_doc(p_thang text, p_so_ky_tu integer)
returns bigint
language sql
set search_path = ''
as $$
  insert into public.giong_doc_thang (thang, so_ky_tu)
  values (p_thang, p_so_ky_tu)
  on conflict (thang) do update
    set so_ky_tu = public.giong_doc_thang.so_ky_tu + excluded.so_ky_tu,
        cap_nhat = now()
  returning so_ky_tu;
$$;

revoke execute on function public.cong_ky_tu_giong_doc(text, integer) from public, anon, authenticated;
grant execute on function public.cong_ky_tu_giong_doc(text, integer) to service_role;
