import { FunctionsHttpError, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { parseOAuthRedirect } from '@/lib/oauth-redirect';
import { supabase } from '@/lib/supabase';

// Đăng nhập của ba mẹ bằng Supabase Auth: email + mã 6 số, hoặc Google.
// Máy chưa đăng nhập có thể đang dùng tài khoản ẩn danh (xem ensureSession).

type AuthState = {
  /** false khi chưa điền cấu hình Supabase trong .env.local. */
  configured: boolean;
  user: User | null;
  /** Đã đăng nhập bằng email/Google (không tính tài khoản ẩn danh). */
  signedIn: boolean;
};

const AuthContext = createContext<AuthState>({ configured: false, user: null, signedIn: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ configured: !!supabase, user, signedIn: !!user && !user.is_anonymous }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function requireSupabase() {
  if (!supabase) throw new Error('App chưa được nối với Supabase. Xem hướng dẫn trong docs/supabase.md.');
  return supabase;
}

/** Gửi mã 6 số vào email của ba mẹ (tự tạo tài khoản nếu email chưa có). */
export async function sendEmailCode(email: string) {
  const { error } = await requireSupabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string) {
  const { error } = await requireSupabase().auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

// Supabase trả phiên đăng nhập về địa chỉ này sau khi đăng nhập Google trên trình duyệt.
// Trong Expo Go có dạng exp://…/--/dang-nhap; ở bản build là giasutieuhoc://dang-nhap.
const oauthRedirect = Linking.createURL('dang-nhap');

/** Cờ báo "vừa quay lại từ Google" để web làm nốt bước sau đăng nhập (xem web/auth-return.tsx). */
export const WEB_OAUTH_PENDING_KEY = 'gsth.oauth.pending';

/**
 * Trả về false nếu ba mẹ đóng trình duyệt giữa chừng.
 * Trên web: chuyển hẳn sang trang Google rồi Google đưa về /dang-nhap (hàm trả false vì trang sắp rời đi).
 */
export async function signInWithGoogle() {
  const client = requireSupabase();
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(WEB_OAUTH_PENDING_KEY, '1');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dang-nhap` },
    });
    if (error) {
      window.sessionStorage.removeItem(WEB_OAUTH_PENDING_KEY);
      throw error;
    }
    return false;
  }
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirect, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirect);
  if (result.type !== 'success') return false;

  const redirect = parseOAuthRedirect(result.url);
  if (redirect.kind === 'error') throw new Error(redirect.message);
  if (redirect.kind === 'code') {
    const { error: exchangeError } = await client.auth.exchangeCodeForSession(redirect.code);
    if (exchangeError) throw exchangeError;
    return true;
  }
  if (redirect.kind === 'empty') throw new Error('Google không trả về phiên đăng nhập.');
  const { error: sessionError } = await client.auth.setSession({
    access_token: redirect.accessToken,
    refresh_token: redirect.refreshToken,
  });
  if (sessionError) throw sessionError;
  return true;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Xoá tài khoản và toàn bộ dữ liệu của bé trên máy chủ (hàm "xoa-tai-khoan"), rồi thoát
 * phiên trên máy này. Dữ liệu trên máy do màn gọi tự xoá (hồ sơ, lịch sử, ảnh).
 */
export async function deleteAccount() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.functions.invoke('xoa-tai-khoan', { method: 'POST' });
  if (error) {
    let message = 'Chưa xoá được tài khoản. Ba mẹ kiểm tra mạng rồi thử lại nhé.';
    if (error instanceof FunctionsHttpError) {
      const body = await (error.context as Response).json().catch(() => null);
      if (typeof body?.error === 'string') message = body.error;
    }
    throw new Error(message);
  }
  // Tài khoản đã bị xoá trên máy chủ nên chỉ cần quên phiên trên máy này.
  await supabase.auth.signOut({ scope: 'local' });
}
