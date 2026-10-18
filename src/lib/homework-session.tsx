import * as ImagePicker from 'expo-image-picker';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { gradeHomework, type Subject } from '@/lib/grading';
import { addHistoryEntry, type HistoryEntry } from '@/lib/history';
import { savePagesLocally } from '@/lib/page-images';
import { getPremiumStatus } from '@/lib/payments';
import { preparePhotoForGrading } from '@/lib/prepare-photo';
import { useTeacher } from '@/lib/profile';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';

/** Số trang tối đa mỗi lần chấm (khớp maxPages trong supabase/functions/cham-bai). */
export const MAX_PAGES = 6;

// Trạng thái bài đang làm, dùng chung giữa các tab Trang chủ / Quét bài / Chữa bài.
type HomeworkSession = {
  grade: number;
  setGrade: (grade: number) => void;
  subject: Subject;
  setSubject: (subject: Subject) => void;
  /** Các trang đã chụp / chọn, theo thứ tự. */
  photos: ImagePicker.ImagePickerAsset[];
  removePhoto: (index: number) => void;
  grading: boolean;
  /** Kết quả chấm gần nhất trong lần mở app này. */
  latest: HistoryEntry | null;
  /** Chụp thêm một trang, hoặc chọn nhiều trang từ album (thêm vào sau các trang đã có). */
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
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
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

    const remaining = MAX_PAGES - photos.length;
    if (remaining <= 0) {
      Alert.alert('Đủ trang rồi', `Mỗi lần chấm tối đa ${MAX_PAGES} trang. Con chấm bộ này trước nhé!`);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      // Lấy ảnh gốc chất lượng cao; lúc chấm mới thu nhỏ và nén (xem prepare-photo.ts).
      quality: 1,
      // Album: chọn nhiều trang một lần, theo thứ tự bấm chọn.
      allowsMultipleSelection: source === 'library',
      selectionLimit: remaining,
      orderedSelection: true,
    };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;

    stopSpeech();
    setPhotos((current) => [...current, ...picked.assets].slice(0, MAX_PAGES));
  }

  async function submitForGrading() {
    if (photos.length === 0) return false;
    setGrading(true);
    try {
      const prepared = await Promise.all(photos.map(preparePhotoForGrading));
      const { result: graded, engine } = await gradeHomework({
        images: prepared.map((page) => page.base64),
        subject,
        grade,
        teacher: teacher.id,
      });
      const id = String(Date.now());
      // Giữ ảnh các trang để ba mẹ xem lại; lỗi lưu ảnh thì vẫn giữ kết quả chấm.
      const pages = await savePagesLocally(
        id,
        prepared.map((page) => page.uri),
      ).catch((error) => {
        console.warn('Chưa lưu được ảnh bài làm trên máy:', error);
        return [];
      });
      const entry: HistoryEntry = {
        ...graded,
        id,
        createdAt: new Date().toISOString(),
        subject,
        grade,
        pages,
        engine,
      };
      setLatest(entry);
      setPhotos([]);
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
    setPhotos([]);
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  return (
    <HomeworkSessionContext.Provider
      value={{
        grade,
        setGrade,
        subject,
        setSubject,
        photos,
        removePhoto,
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
