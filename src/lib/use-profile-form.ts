import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { purchaseErrorMessage, usePremium } from '@/lib/payments';
import { avatarOptions, useProfile } from '@/lib/profile';
import { speakVietnamese } from '@/lib/speech';
import { teachers, type TeacherId } from '@/lib/teacher';

// Logic màn "Hồ sơ của bé" (tạo lần đầu và sửa), tách khỏi giao diện để bản web dùng lại.
// Giữ đúng hành vi của src/app/ho-so.tsx; màn điện thoại có thể chuyển sang hook này sau (GIA-58).

export const GRADE_OPTIONS = [
  { grade: 1, hint: 'Làm quen chữ & số' },
  { grade: 2, hint: 'Cộng trừ có nhớ' },
  { grade: 3, hint: 'Bảng nhân, chia' },
  { grade: 4, hint: 'Phân số, văn tả' },
  { grade: 5, hint: 'Số thập phân & tốt nghiệp tiểu học' },
] as const;

export const DEFAULT_GRADE = 2;

/** Hết gói Plus thì lưu lại là Cô giáo. */
export function effectiveTeacher(teacher: TeacherId, isPremium: boolean): TeacherId {
  return isPremium ? teacher : 'co';
}

export function useProfileForm() {
  const { profile, saveProfile } = useProfile();
  const { isPremium, showPaywall } = usePremium();
  const [name, setName] = useState(profile?.name ?? '');
  const [grade, setGrade] = useState<number>(profile?.grade ?? DEFAULT_GRADE);
  const [avatar, setAvatar] = useState<string>(profile?.avatar ?? avatarOptions[0].id);
  const [teacher, setTeacher] = useState<TeacherId>(profile?.teacher ?? 'co');
  const chosenTeacher = effectiveTeacher(teacher, isPremium);
  const editing = profile !== null;

  function pickTeacher(id: TeacherId) {
    if (id === 'thay' && !isPremium) {
      Alert.alert(
        'Dành cho gói Plus',
        'Chọn học cùng Thầy giáo (hình và giọng đọc của thầy) có trong gói Gia sư Tiểu học Plus.',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Xem gói Plus',
            onPress: () => {
              // Mua xong quay lại đây: isPremium đổi thành true, chạm Thầy giáo là chọn được.
              setTeacher('thay');
              try {
                showPaywall();
              } catch (error) {
                const message = purchaseErrorMessage(error);
                if (message) Alert.alert('Chưa xong', message);
              }
            },
          },
        ],
      );
      return;
    }
    setTeacher(id);
    const T = teachers[id];
    speakVietnamese(`Chào con, ${T.word} là ${T.word} giáo của con đây!`, undefined, id);
  }

  async function finish(next = { name: name.trim(), grade, avatar, teacher: chosenTeacher }) {
    await saveProfile(next);
    // Lần đầu: lưu xong thì các tab mở khoá, vào Trang chủ. Đang sửa: quay lại màn trước.
    if (editing && router.canGoBack()) router.back();
    else router.replace('/');
  }

  /** "Bỏ qua" lúc tạo lần đầu: lưu hồ sơ không tên. Đang sửa thì không có nút này. */
  const skip = editing ? undefined : () => finish({ name: '', grade, avatar, teacher: chosenTeacher });

  return {
    name,
    setName,
    grade,
    setGrade,
    avatar,
    setAvatar,
    chosenTeacher,
    isPremium,
    editing,
    pickTeacher,
    finish: () => finish(),
    skip,
  };
}
