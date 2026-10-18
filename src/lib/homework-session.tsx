import * as ImagePicker from 'expo-image-picker';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { gradeHomework, type Subject } from '@/lib/grading';
import { addHistoryEntry, type HistoryEntry } from '@/lib/history';
import { getPremiumStatus } from '@/lib/payments';
import { preparePhotoForGrading } from '@/lib/prepare-photo';
import { useTeacher } from '@/lib/profile';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';

// Trạng thái bài đang làm, dùng chung giữa các tab Trang chủ / Quét bài / Chữa bài.
type HomeworkSession = {
  grade: number;
  setGrade: (grade: number) => void;
  subject: Subject;
  setSubject: (subject: Subject) => void;
  photo: ImagePicker.ImagePickerAsset | null;
  grading: boolean;
  /** Kết quả chấm gần nhất trong lần mở app này. */
  latest: HistoryEntry | null;
  pickPhoto: (source: 'camera' | 'library') => Promise<void>;
  /** Trả về true nếu chấm xong. */
  submitForGrading: () => Promise<boolean>;
  startOver: () => void;
  /** Cô có đang đọc lời nhận xét không. */
  speaking: boolean;
  speak: (text: string) => void;
  stopSpeech: () => void;
  notice: Notice | null;
  dismissNotice: () => void;
};

const HomeworkSessionContext = createContext<HomeworkSession | null>(null);

/** Thông báo nhỏ tự ẩn ở đầu màn hình (xem components/notice-toast.tsx). */
export type Notice = { id: number; title: string; message: string };

// Lời báo khi bài được chấm bằng AI trên máy tính ở nhà thay vì Claude.
async function localGradingNotice(): Promise<Notice> {
  const { isPremium } = await getPremiumStatus();
  return {
    id: Date.now(),
    title: isPremium ? 'Máy chủ đang bận' : 'Bạn chưa mua gói Gia sư Tiểu học Plus',
    message:
      'Bài này được chấm bằng AI trên máy tính ở nhà (LM Studio), kết quả có thể kém chính xác hơn.',
  };
}

export function HomeworkSessionProvider({
  children,
  initialGrade = 2,
}: {
  children: ReactNode;
  /** Lớp của bé trong hồ sơ; vẫn đổi được ngay trên màn Quét bài. */
  initialGrade?: number;
}) {
  const [grade, setGrade] = useState(initialGrade);
  const [subject, setSubject] = useState<Subject>('toan');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [grading, setGrading] = useState(false);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const teacher = useTeacher();
  const [notice, setNotice] = useState<Notice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  function speak(text: string) {
    setSpeaking(true);
    speakVietnamese(text, { onDone: () => setSpeaking(false) }, teacher.id);
  }

  // Giữ cố định để màn Chữa bài dùng làm hàm dọn dẹp khi rời tab.
  const stopSpeech = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  async function pickPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Bố mẹ hãy cho phép app dùng camera hoặc thư viện ảnh nhé.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      // Lấy ảnh gốc chất lượng cao; lúc chấm mới thu nhỏ và nén (xem prepare-photo.ts).
      quality: 1,
    };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;

    stopSpeech();
    setPhoto(picked.assets[0]);
  }

  async function submitForGrading() {
    if (!photo) return false;
    setGrading(true);
    try {
      const imageBase64 = await preparePhotoForGrading(photo);
      const { result: graded, engine } = await gradeHomework({ imageBase64, subject, grade, teacher: teacher.id });
      const entry: HistoryEntry = {
        ...graded,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        subject,
        grade,
      };
      setLatest(entry);
      setPhoto(null);
      speak(graded.spokenFeedback);
      // Báo mỗi lần chấm bằng LM Studio, bằng thông báo nhỏ tự ẩn để không làm phiền bé.
      if (engine === 'local') localGradingNotice().then(setNotice);
      await addHistoryEntry(entry);
      return true;
    } catch (error) {
      Alert.alert('Chưa chấm được bài', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setGrading(false);
    }
  }

  function startOver() {
    stopSpeech();
    setPhoto(null);
  }

  return (
    <HomeworkSessionContext.Provider
      value={{
        grade,
        setGrade,
        subject,
        setSubject,
        photo,
        grading,
        latest,
        pickPhoto,
        submitForGrading,
        startOver,
        notice,
        dismissNotice,
        speaking,
        speak,
        stopSpeech,
      }}>
      {children}
    </HomeworkSessionContext.Provider>
  );
}

export function useHomeworkSession() {
  const session = useContext(HomeworkSessionContext);
  if (!session) throw new Error('useHomeworkSession phải nằm trong HomeworkSessionProvider');
  return session;
}
