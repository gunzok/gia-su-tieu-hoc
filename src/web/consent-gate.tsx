import { router, usePathname } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Phiên bản điều khoản; đổi số này khi sửa điều khoản để hỏi lại ba mẹ.
export const CONSENT_VERSION = 'v1';
const STORAGE_KEY = `gsth.consent.${CONSENT_VERSION}`;
// Hai trang để ba mẹ đọc, không bị hộp xác nhận che.
const READING_PATHS = ['/chinh-sach', '/dieu-khoan'];

function readConsent() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// Đồng ý trong lần mở này dù trình duyệt không cho lưu.
let agreedInMemory = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const currentAgreement = () => agreedInMemory || readConsent();

// Bản web: ba mẹ phải đồng ý Điều khoản và Chính sách (và xác nhận là người giám hộ của bé) trước khi dùng (GIA-67/71).
// Lưu trong trình duyệt; nếu đã đăng nhập thật thì ghi thêm vào hồ sơ tài khoản để có bằng chứng đồng ý.
export function ConsentGate() {
  const pathname = usePathname();
  const { signedIn } = useAuth();
  // Lúc dựng trang sẵn trên máy chủ coi như đã đồng ý, để không nháy hộp thoại; trình duyệt đọc lại localStorage.
  const agreed = useSyncExternalStore(subscribe, currentAgreement, () => true);

  // Đã đồng ý trước khi đăng nhập thì ghi vào tài khoản ngay khi đăng nhập xong.
  useEffect(() => {
    if (!agreed || !signedIn || !supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.user_metadata?.consent_version !== CONSENT_VERSION) {
        supabase?.auth.updateUser({ data: { consent_version: CONSENT_VERSION, consent_at: new Date().toISOString() } });
      }
    });
  }, [agreed, signedIn]);

  if (Platform.OS !== 'web' || agreed || READING_PATHS.includes(pathname)) return null;

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Trình duyệt chặn lưu: vẫn cho dùng trong lần mở này.
    }
    agreedInMemory = true;
    listeners.forEach((listener) => listener());
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View accessibilityRole="alert" style={styles.dialog}>
          <AppText variant="headlineSm">Ba mẹ đồng ý trước khi dùng nhé</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Gia sư Tiểu học dành cho bé lớp 1–5 và cần có ba mẹ (người giám hộ) đồng hành. Ảnh bài làm của bé được gửi
            tới AI để chấm. Ba mẹ vui lòng đọc kỹ trước khi tiếp tục.
          </AppText>
          <View style={styles.links}>
            <Pressable accessibilityRole="link" onPress={() => router.navigate('/chinh-sach' as never)} style={styles.link}>
              <AppText variant="labelLg" color={Palette.blue}>
                Chính sách quyền riêng tư
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.navigate('/dieu-khoan' as never)} style={styles.link}>
              <AppText variant="labelLg" color={Palette.blue}>
                Điều khoản sử dụng
              </AppText>
            </Pressable>
          </View>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Bằng việc bấm nút bên dưới, tôi xác nhận là ba/mẹ hoặc người giám hộ của bé và đồng ý với hai văn bản trên.
          </AppText>
          <BigButton label="Tôi đồng ý và tiếp tục" icon="check-circle" onPress={accept} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    backgroundColor: 'rgba(17,28,45,0.55)',
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
  },
  links: { gap: Spacing.one },
  link: { minHeight: 44, justifyContent: 'center' },
});
