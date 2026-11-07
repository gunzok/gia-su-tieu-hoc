import { allowedOrigins, corsHeaders, originAllowed } from '../../../supabase/functions/_shared/cors';

describe('CORS cho bản web (GIA-70)', () => {
  const allowed = allowedOrigins('https://gia-su.example.com/, https://thu.gia-su.example.com');

  it('đọc danh sách, bỏ khoảng trắng và dấu / cuối', () => {
    expect(allowed).toEqual(['https://gia-su.example.com', 'https://thu.gia-su.example.com']);
    expect(allowedOrigins(undefined)).toEqual([]);
  });

  it('nguồn trong danh sách được cấp quyền đúng nguồn đó', () => {
    expect(corsHeaders('https://thu.gia-su.example.com', allowed)['Access-Control-Allow-Origin']).toBe(
      'https://thu.gia-su.example.com',
    );
  });

  it('nguồn lạ không được cấp quyền', () => {
    expect(corsHeaders('https://evil.example.com', allowed)['Access-Control-Allow-Origin']).toBeUndefined();
    expect(originAllowed('https://evil.example.com', allowed)).toBe(false);
  });

  it('app điện thoại (không có Origin) vẫn gọi được', () => {
    expect(originAllowed(null, allowed)).toBe(true);
  });

  it('chưa đặt danh sách thì cho mọi nguồn (chỉ để thử)', () => {
    expect(corsHeaders('https://bat-ky.com', [])['Access-Control-Allow-Origin']).toBe('*');
    expect(originAllowed('https://bat-ky.com', [])).toBe(true);
  });
});
