import { FunctionsHttpError, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

/** Trả về false nếu ba mẹ đóng trình duyệt giữa chừng. */
export async function signInWithGoogle() {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: oauthRedirect, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirect);
  if (result.type !== 'success') return false;

  // Phiên đăng nhập nằm sau dấu # (luồng implicit) hoặc là ?code= (luồng PKCE).
  const url = new URL(result.url.replace('#', '?'));
  const errorDescription = url.searchParams.get('error_description');
  if (errorDescription) throw new Error(errorDescription);

  const code = url.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return true;
  }
  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('Google không trả về phiên đăng nhập.');
  const { error: sessionError } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
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
