// Supabase Edge Function "xoa-tai-khoan": ba mẹ xoá tài khoản và toàn bộ dữ liệu của bé
// (Apple / Google bắt buộc có trong app). Dùng service role nên chỉ chạy trên máy chủ.
//
// Triển khai:  npx supabase functions deploy xoa-tai-khoan
//
// Xoá: ảnh bài làm trong kho "bai-lam", rồi tài khoản đăng nhập. Các bảng children, gradings,
// grading_usage có "on delete cascade" theo tài khoản nên tự xoá theo.
// Gói Plus mua qua App Store / Google Play không tự huỷ: ba mẹ huỷ trong cửa hàng.

import { allowedOrigins, corsHeaders, originAllowed } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const bucket = 'bai-lam';


Deno.serve(async (req) => {
  // Chỉ các địa chỉ web trong ALLOWED_ORIGINS mới được gọi từ trình duyệt (GIA-70).
  const origin = req.headers.get('Origin');
  const allowed = allowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const cors = corsHeaders(origin, allowed);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!originAllowed(origin, allowed)) return json({ error: 'Địa chỉ này không được phép' }, 403);
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);
  const userId = userData.user.id;

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    // Ảnh nằm ở {id tài khoản}/{mã bài chấm}/1.jpg …; list() không tự đi vào thư mục con.
    const storage = admin.storage.from(bucket);
    const paths: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: folders, error } = await storage.list(userId, { limit: 1000, offset });
      if (error) throw error;
      for (const folder of folders) {
        const prefix = `${userId}/${folder.name}`;
        // Mục có id là file nằm thẳng trong thư mục tài khoản; không có id là thư mục con.
        if (folder.id) {
          paths.push(prefix);
          continue;
        }
        const { data: files, error: filesError } = await storage.list(prefix, { limit: 1000 });
        if (filesError) throw filesError;
        paths.push(...files.map((file) => `${prefix}/${file.name}`));
      }
      if (folders.length < 1000) break;
    }
    for (let i = 0; i < paths.length; i += 1000) {
      const { error } = await storage.remove(paths.slice(i, i + 1000));
      if (error) throw error;
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
    return json({ ok: true });
  } catch (error) {
    console.error('Lỗi xoá tài khoản:', error);
    return json({ error: 'Chưa xoá được tài khoản. Ba mẹ thử lại sau nhé.' }, 500);
  }
});
