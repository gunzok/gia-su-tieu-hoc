import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { sessionStorage } from '@/lib/session-storage';

// Supabase: đăng nhập của ba mẹ, lưu hồ sơ bé và lịch sử chấm bài lên máy chủ,
// và hàm "cham-bai" giữ Claude API key. Chưa điền cấu hình trong .env.local thì
// supabase = null và app vẫn chạy bình thường, chỉ lưu trên máy.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: sessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (supabase) {
  // Chỉ làm mới phiên đăng nhập khi app đang mở, theo hướng dẫn của Expo.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Người dùng hiện tại (kể cả ẩn danh), hoặc null nếu chưa đăng nhập / chưa cấu hình. */
export async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Máy chưa đăng nhập thì tạo tài khoản ẩn danh, để vẫn gọi được hàm chấm bài và lưu
 * dữ liệu lên máy chủ. Cần bật "Anonymous sign-ins" trong Supabase; nếu chưa bật thì bỏ qua.
 */
export async function ensureSession() {
  if (!supabase) return null;
  const existing = await currentUserId();
  if (existing) return existing;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('Chưa đăng nhập ẩn danh được:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}
