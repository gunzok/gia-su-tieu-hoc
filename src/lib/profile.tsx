import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { pullProfile, pushProfile } from '@/lib/cloud';
import { ensureSession } from '@/lib/supabase';
import { useIsPremium } from '@/lib/payments';
import { teacherOf, type TeacherId } from '@/lib/teacher';

// Hồ sơ của bé, lưu trên máy. Chưa có hồ sơ nghĩa là app mở lần đầu: hiện màn Khởi động.
export type ChildProfile = {
  /** Tên thân mật để Cô xưng hô; có thể để trống. */
  name: string;
  grade: number;
  avatar: string;
  /** Học cùng Cô giáo hay Thầy giáo; Thầy chỉ chọn được khi có gói Plus. */
  teacher?: TeacherId;
};

export const avatarOptions = [
  { id: 'be-trai', emoji: '👦', label: 'Bé trai' },
  { id: 'be-gai', emoji: '👧', label: 'Bé gái' },
  { id: 'gau-con', emoji: '🐻', label: 'Gấu con' },
  { id: 'sieu-nhan', emoji: '🦸', label: 'Siêu nhân' },
  { id: 'tho-con', emoji: '🐰', label: 'Thỏ con' },
  { id: 'ky-lan', emoji: '🦄', label: 'Kỳ lân' },
] as const;

export function avatarEmoji(id: string) {
  return avatarOptions.find((option) => option.id === id)?.emoji ?? '🙂';
}

const STORAGE_KEY = 'ho-so-be';

type ProfileState = {
  /** Đã đọc xong hồ sơ từ máy chưa. */
  ready: boolean;
  profile: ChildProfile | null;
  saveProfile: (profile: ChildProfile) => Promise<void>;
  /**
   * Gọi sau khi ba mẹ đăng nhập: lấy hồ sơ bé trên máy chủ về (nếu có),
   * nếu chưa có thì đẩy hồ sơ trên máy lên. Trả về hồ sơ đang dùng.
   */
  syncAfterSignIn: () => Promise<ChildProfile | null>;
  /** Xoá hồ sơ trên máy (sau khi xoá tài khoản): app quay về màn Khởi động. */
  clearProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setProfile(raw ? (JSON.parse(raw) as ChildProfile) : null))
      .finally(() => setReady(true));
  }, []);

  async function saveLocal(next: ChildProfile) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  }

  async function saveProfile(next: ChildProfile) {
    await saveLocal(next);
    // Chưa đăng nhập thì tạo tài khoản ẩn danh để vẫn chấm bài bằng Claude và lưu lên máy chủ.
    ensureSession()
      .then(() => pushProfile(next))
      .catch((error) => console.warn('Chưa lưu được hồ sơ lên máy chủ:', error));
  }

  async function syncAfterSignIn() {
    try {
      const remote = await pullProfile();
      if (remote) {
        await saveLocal(remote);
        return remote;
      }
      if (profile) await pushProfile(profile);
    } catch (error) {
      console.warn('Chưa đồng bộ được hồ sơ:', error);
    }
    return profile;
  }

  async function clearProfile() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }

  return (
    <ProfileContext.Provider value={{ ready, profile, saveProfile, syncAfterSignIn, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const state = useContext(ProfileContext);
  if (!state) throw new Error('useProfile phải nằm trong ProfileProvider');
  return state;
}

/** Gia sư bé đang học cùng. Hết gói Plus thì quay về Cô giáo. */
export function useTeacher() {
  const { profile } = useProfile();
  const isPremium = useIsPremium();
  return teacherOf(isPremium ? profile?.teacher : 'co');
}
