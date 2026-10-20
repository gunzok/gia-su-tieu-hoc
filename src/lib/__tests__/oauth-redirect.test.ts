import { parseOAuthRedirect } from '@/lib/oauth-redirect';

describe('parseOAuthRedirect', () => {
  it('luồng implicit: phiên đăng nhập sau dấu #', () => {
    expect(
      parseOAuthRedirect('giasutieuhoc://dang-nhap#access_token=abc&refresh_token=def&token_type=bearer'),
    ).toEqual({ kind: 'tokens', accessToken: 'abc', refreshToken: 'def' });
  });

  it('luồng PKCE: ?code=', () => {
    expect(parseOAuthRedirect('giasutieuhoc://dang-nhap?code=xyz')).toEqual({ kind: 'code', code: 'xyz' });
  });

  it('link Expo Go vừa có ? vừa có #', () => {
    expect(
      parseOAuthRedirect('exp://192.168.1.5:8081/--/dang-nhap?foo=1#access_token=a.b.c&refresh_token=r'),
    ).toEqual({ kind: 'tokens', accessToken: 'a.b.c', refreshToken: 'r' });
  });

  it('lỗi từ Supabase, giải mã chữ', () => {
    expect(
      parseOAuthRedirect('giasutieuhoc://dang-nhap#error=access_denied&error_description=Ng%C6%B0%E1%BB%9Di+d%C3%B9ng+h%E1%BB%A7y'),
    ).toEqual({ kind: 'error', message: 'Người dùng hủy' });
    expect(parseOAuthRedirect('giasutieuhoc://dang-nhap?error=server_error')).toEqual({
      kind: 'error',
      message: 'server_error',
    });
  });

  it('thiếu refresh_token hoặc không có gì', () => {
    expect(parseOAuthRedirect('giasutieuhoc://dang-nhap#access_token=abc')).toEqual({ kind: 'empty' });
    expect(parseOAuthRedirect('giasutieuhoc://dang-nhap')).toEqual({ kind: 'empty' });
  });

  it('chữ % lỗi không làm hỏng', () => {
    expect(parseOAuthRedirect('giasutieuhoc://dang-nhap#error_description=50%')).toEqual({
      kind: 'error',
      message: '50%',
    });
  });
});
