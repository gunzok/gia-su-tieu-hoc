// Đọc link Supabase trả về app sau khi ba mẹ đăng nhập Google trên trình duyệt.
// Phiên đăng nhập nằm sau dấu # (luồng implicit) hoặc là ?code= (luồng PKCE); lỗi có thể ở
// cả hai chỗ. Link Expo Go có thể vừa có ?… vừa có #…, nên đọc riêng từng phần.

export type OAuthRedirect =
  | { kind: 'code'; code: string }
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'error'; message: string }
  | { kind: 'empty' };

function readParams(part: string) {
  const params: Record<string, string> = {};
  for (const pair of part.split('&')) {
    if (!pair) continue;
    const [rawKey, ...rest] = pair.split('=');
    const decode = (text: string) => {
      try {
        return decodeURIComponent(text.replace(/\+/g, ' '));
      } catch {
        return text;
      }
    };
    params[decode(rawKey)] = decode(rest.join('='));
  }
  return params;
}

export function parseOAuthRedirect(url: string): OAuthRedirect {
  const hashAt = url.indexOf('#');
  const beforeHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt + 1) : '';
  const queryAt = beforeHash.indexOf('?');
  const query = queryAt >= 0 ? beforeHash.slice(queryAt + 1) : '';
  // Giá trị sau # được ưu tiên vì Supabase đặt phiên đăng nhập ở đó.
  const params = { ...readParams(query), ...readParams(hash) };

  if (params.error || params.error_description) {
    return { kind: 'error', message: params.error_description || params.error };
  }
  if (params.code) return { kind: 'code', code: params.code };
  if (params.access_token && params.refresh_token) {
    return { kind: 'tokens', accessToken: params.access_token, refreshToken: params.refresh_token };
  }
  return { kind: 'empty' };
}
