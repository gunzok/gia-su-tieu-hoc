import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { sendEmailCode, signInWithGoogle, useAuth, verifyEmailCode } from '@/lib/auth';
import { cleanEmailCode, isValidEmailCode } from '@/lib/email-code';
import { useProfile } from '@/lib/profile';

// Logic màn "Ba Mẹ đăng nhập" (email + mã, Google), tách khỏi giao diện để bản web dùng lại.
// Giữ đúng hành vi của src/app/dang-nhap.tsx; màn điện thoại có thể chuyển sang hook này sau (GIA-58).

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email ba mẹ gõ: bỏ khoảng trắng hai đầu, chữ thường. Sai định dạng thì trả null. */
export function normalizeEmail(text: string): string | null {
  const trimmed = text.trim().toLowerCase();
  return emailPattern.test(trimmed) ? trimmed : null;
}

export const COMING_SOON_TITLE = 'Sắp có nhé!';
export const COMING_SOON_MESSAGE = 'Cách đăng nhập này đang được chuẩn bị. Ba mẹ dùng email hoặc Google trước nhé.';

/** Apple, số điện thoại và mã trường chưa làm: tạm báo "sắp có". */
export function comingSoon() {
  Alert.alert(COMING_SOON_TITLE, COMING_SOON_MESSAGE);
}

export type LoginBusy = 'email' | 'code' | 'google' | null;

export function useParentLogin() {
  const { configured } = useAuth();
  const { profile, syncAfterSignIn } = useProfile();
  const [email, setEmail] = useState('');
  const [code, setCodeRaw] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState<LoginBusy>(null);

  /** "Bỏ qua": đang có hồ sơ thì quay lại, chưa có thì sang tạo hồ sơ. */
  function leave() {
    if (profile && router.canGoBack()) router.back();
    else router.push('/ho-so');
  }

  // Đăng nhập xong: lấy hồ sơ bé trên máy chủ về. Có hồ sơ thì vào thẳng app, chưa có thì tạo.
  async function afterSignIn() {
    const synced = await syncAfterSignIn();
    if (!synced) router.replace('/ho-so');
    else if (profile && router.canGoBack()) router.back();
    else router.replace('/');
  }

  function guard(action: () => Promise<void>, kind: NonNullable<LoginBusy>) {
    if (!configured) {
      Alert.alert('Chưa nối máy chủ', 'App chưa được nối với Supabase. Xem hướng dẫn trong docs/supabase.md.');
      return;
    }
    setBusy(kind);
    action()
      .catch((error: unknown) =>
        Alert.alert('Chưa đăng nhập được', error instanceof Error ? error.message : String(error)),
      )
      .finally(() => setBusy(null));
  }

  const sendCode = () =>
    guard(async () => {
      const normalized = normalizeEmail(email);
      if (!normalized) throw new Error('Ba mẹ kiểm tra lại địa chỉ email nhé.');
      await sendEmailCode(normalized);
      setEmail(normalized);
      setCodeSent(true);
    }, 'email');

  const confirmCode = () =>
    guard(async () => {
      if (!isValidEmailCode(code)) throw new Error('Ba mẹ nhập đủ các chữ số trong email vừa nhận nhé.');
      await verifyEmailCode(email, code);
      await afterSignIn();
    }, 'code');

  const loginWithGoogle = () =>
    guard(async () => {
      if (await signInWithGoogle()) await afterSignIn();
    }, 'google');

  function changeEmail() {
    setCodeSent(false);
    setCodeRaw('');
  }

  return {
    email,
    setEmail,
    code,
    setCode: (text: string) => setCodeRaw(cleanEmailCode(text)),
    codeSent,
    busy,
    leave,
    sendCode,
    confirmCode,
    loginWithGoogle,
    changeEmail,
  };
}
