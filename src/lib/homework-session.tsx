import * as ImagePicker from 'expo-image-picker';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { gradeHomework, type GradingResult, type Subject } from '@/lib/grading';
import { addHistoryEntry, type HistoryEntry } from '@/lib/history';
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
};

const HomeworkSessionContext = createContext<HomeworkSession | null>(null);

export function HomeworkSessionProvider({ children }: { children: ReactNode }) {
  const [grade, setGrade] = useState(2);
  const [subject, setSubject] = useState<Subject>('toan');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [grading, setGrading] = useState(false);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [speaking, setSpeaking] = useState(false);

  function speak(text: string) {
    setSpeaking(true);
    speakVietnamese(text, { onDone: () => setSpeaking(false) });
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
      quality: 0.5,
      base64: true,
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
    if (!photo?.base64) return false;
    setGrading(true);
    try {
      const graded: GradingResult = await gradeHomework({ imageBase64: photo.base64, subject, grade });
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
