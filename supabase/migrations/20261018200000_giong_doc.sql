-- Kho âm thanh giọng đọc AI (Google Chirp 3 HD), dùng chung cho mọi tài khoản.
-- Tên file là mã băm của (giọng + lời đọc): cùng một câu chỉ tạo âm thanh một lần, lần sau nghe lại miễn phí.
-- Chỉ hàm "doc-loi" (khoá service role trên máy chủ) đọc/ghi kho này; app nhận link có hạn để phát.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('giong-doc', 'giong-doc', false, 2097152, array['audio/mpeg']);
