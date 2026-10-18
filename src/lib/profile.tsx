import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Hồ sơ của bé, lưu trên máy. Chưa có hồ sơ nghĩa là app mở lần đầu: hiện màn Khởi động.
export type ChildProfile = {
  /** Tên thân mật để Cô xưng hô; có thể để trống. */
  name: string;
  grade: number;
  avatar: string;
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

  async function saveProfile(next: ChildProfile) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  }

  return (
    <ProfileContext.Provider value={{ ready, profile, saveProfile }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const state = useContext(ProfileContext);
  if (!state) throw new Error('useProfile phải nằm trong ProfileProvider');
  return state;
}
