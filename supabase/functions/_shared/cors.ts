// CORS cho các hàm gọi từ bản web. Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
//
// Secret ALLOWED_ORIGINS: các địa chỉ web được phép gọi, cách nhau dấu phẩy, ví dụ
//   https://gia-su.example.com,https://thu.gia-su.example.com
// Chưa đặt thì cho mọi nguồn (chỉ để thử); khi lên thật PHẢI đặt (GIA-70).

const baseHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

export function allowedOrigins(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** Header CORS cho một yêu cầu. Nguồn không nằm trong danh sách thì không được cấp quyền (trình duyệt sẽ chặn). */
export function corsHeaders(origin: string | null | undefined, allowed: string[]): Record<string, string> {
  if (allowed.length === 0) return { ...baseHeaders, 'Access-Control-Allow-Origin': '*' };
  if (origin && allowed.includes(origin)) return { ...baseHeaders, 'Access-Control-Allow-Origin': origin };
  return { ...baseHeaders };
}

/** Yêu cầu từ trình duyệt mà nguồn không nằm trong danh sách thì từ chối hẳn, không chỉ chặn đọc kết quả (tránh tốn tiền AI). */
export function originAllowed(origin: string | null | undefined, allowed: string[]) {
  return allowed.length === 0 || !origin || allowed.includes(origin);
}
