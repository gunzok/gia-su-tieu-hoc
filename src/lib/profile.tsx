import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { pullProfile, pushProfile } from '@/lib/cloud';
import { ensureSession } from '@/lib/supabase';
import { useIsPremium } from '@/lib/payments';
import { applyGrading, emptyRewards, parseRewards, type Rewards } from '@/lib/rewards';
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
/** Sao và chuỗi ngày của bé đang dùng hồ sơ trên máy; xoá hồ sơ thì xoá theo. */
const REWARDS_KEY = 'phan-thuong-be';

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
  /** Sao thưởng và chuỗi ngày học của bé. */
  rewards: Rewards;
  /** Gọi sau mỗi bài chấm xong: +15 sao, cập nhật chuỗi ngày. Trả về phần thưởng mới. */
  recordGrading: () => Promise<Rewards>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [rewards, setRewards] = useState<Rewards>(emptyRewards);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, REWARDS_KEY])
      .then(([[, rawProfile], [, rawRewards]]) => {
        setProfile(rawProfile ? (JSON.parse(rawProfile) as ChildProfile) : null);
        setRewards(parseRewards(rawRewards));
      })
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
    await AsyncStorage.multiRemove([STORAGE_KEY, REWARDS_KEY]);
    setProfile(null);
    setRewards(emptyRewards);
  }

  async function recordGrading() {
    // Tính từ bản đang lưu trên máy để luôn cộng vào số sao mới nhất.
    const next = applyGrading(parseRewards(await AsyncStorage.getItem(REWARDS_KEY)), new Date());
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(next));
    setRewards(next);
    return next;
  }

  return (
    <ProfileContext.Provider value={{ ready, profile, saveProfile, syncAfterSignIn, clearProfile, rewards, recordGrading }}>
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
