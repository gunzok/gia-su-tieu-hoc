import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { GradingError, gradeHomework, type Subject } from '@/lib/grading';
import { addHistoryEntry, type HistoryEntry } from '@/lib/history';
import { askAboutLevel, checkLevel } from '@/lib/level-check';
import { savePagesLocally } from '@/lib/page-images';
import { scanPages } from '@/lib/document-scanner';
import { problemMessage, type PhotoProblem } from '@/lib/photo-quality';
import { checkPhotoQuality, preparePhotoForGrading } from '@/lib/prepare-photo';
import { useProfile, useTeacher } from '@/lib/profile';
import { readPageLines } from '@/lib/read-page-text';
import type { Rewards } from '@/lib/rewards';
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
  /** Sao và chuỗi ngày ngay sau bài `latest` (để màn Chữa bài khen "+15 ⭐"). */
  latestReward: Rewards | null;
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

/** Ảnh album có assetId; ảnh vừa chụp thì mỗi lần một uri mới. */
function photoKey(asset: ImagePicker.ImagePickerAsset) {
  return asset.assetId ?? asset.uri;
}

/** Hỏi có dùng ảnh chưa đạt không. Trả về true nếu vẫn dùng. */
function askKeepPhoto(problem: PhotoProblem, source: 'camera' | 'library', page?: number) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      page ? `Ảnh thứ ${page} chưa rõ` : 'Chụp lại nhé',
      problemMessage(problem),
      [
        { text: 'Vẫn dùng ảnh này', style: 'cancel', onPress: () => resolve(true) },
        { text: source === 'camera' ? 'Chụp lại' : 'Bỏ ảnh này', onPress: () => resolve(false) },
      ],
      { cancelable: false },
    );
  });
}

const HomeworkSessionContext = createContext<HomeworkSession | null>(null);

/** Thông báo nhỏ tự ẩn ở đầu màn hình (xem components/notice-toast.tsx). */
export type Notice = { id: number; title: string; message: string };

export function HomeworkSessionProvider({
  children,
  initialGrade = 2,
}: {
  children: ReactNode;
  /** Lớp của bé trong hồ sơ; vẫn đổi được ngay trên màn Quét bài. */
  initialGrade?: number;
}) {
  const [grade, setGrade] = useState(initialGrade);
  // Hồ sơ đổi lớp (màn Sửa hồ sơ, hoặc bố mẹ chọn "Đổi hồ sơ sang lớp …"): lớp đang chấm đổi theo.
  const [profileGrade, setProfileGrade] = useState(initialGrade);
  if (profileGrade !== initialGrade) {
    setProfileGrade(initialGrade);
    setGrade(initialGrade);
  }
  const { profile, saveProfile, recordGrading } = useProfile();
  const [subject, setSubject] = useState<Subject>('toan');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [grading, setGrading] = useState(false);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [latestReward, setLatestReward] = useState<Rewards | null>(null);
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
    // Chụp: ưu tiên trình quét trang (cắt mép, làm thẳng; GIA-47); máy không quét được thì dùng camera thường.
    const scanned = source === 'camera' ? await scanPages(remaining) : null;
    if (scanned && scanned.length === 0) return;
    const picked: { canceled: boolean; assets: ImagePicker.ImagePickerAsset[] | null } = scanned
      ? { canceled: false, assets: scanned.map((page) => ({ ...page, type: 'image' as const })) }
      : source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled || !picked.assets) return;
    const assets = picked.assets;

    // Ảnh trong album đã chọn rồi thì bỏ qua (GIA-50).
    const chosen = new Set(photos.map(photoKey));
    const fresh = assets.filter((asset) => {
      const key = photoKey(asset);
      if (chosen.has(key)) return false;
      chosen.add(key);
      return true;
    });
    if (fresh.length < assets.length) {
      setNotice({ id: Date.now(), title: 'Trang này con chọn rồi', message: 'Cô bỏ bớt trang trùng cho con nhé.' });
    }

    // Ảnh mờ, tối, lóa: nhắc bé chụp lại trước khi chấm (GIA-48). Ba mẹ vẫn chọn dùng ảnh đó được,
    // phòng khi máy đo nhầm. Đo lỗi thì cứ dùng ảnh.
    const kept: ImagePicker.ImagePickerAsset[] = [];
    for (const [index, asset] of fresh.entries()) {
      const problems = await checkPhotoQuality(asset).catch((error) => {
        console.warn('Chưa đo được chất lượng ảnh:', error);
        return [];
      });
      const page = fresh.length > 1 ? index + 1 : undefined;
      if (problems.length === 0 || (await askKeepPhoto(problems[0], source, page))) kept.push(asset);
    }
    if (kept.length === 0) {
      if (source === 'camera') await pickPhoto('camera');
      return;
    }

    stopSpeech();
    setPhotos((current) => [...current, ...kept].slice(0, MAX_PAGES));
  }

  async function submitForGrading() {
    if (photos.length === 0) return false;
    setGrading(true);
    try {
      const prepared = await Promise.all(photos.map(preparePhotoForGrading));
      const images = prepared.map((page) => page.base64);
      // Môn Toán: đọc chữ trên ảnh để máy chủ tự tính đáp án gửi kèm cho AI (GIA-53).
      const pageLines =
        subject === 'toan' ? await Promise.all(prepared.map((page) => readPageLines(page.uri))) : undefined;
      const { result: graded, engine } = await gradeHomework({
        images,
        pageLines,
        subject,
        grade,
        teacher: teacher.id,
      });

      // Ảnh không phải bài tập, hoặc bài không hợp lớp của bé: hỏi bố mẹ trước khi hiện kết quả.
      let gradedAs = grade;
      const verdict = checkLevel(graded, grade);
      if (verdict.kind !== 'ok') {
        const choice = await askAboutLevel(verdict, grade);
        if (choice === 'retake') {
          setPhotos([]);
          return false;
        }
        if (choice === 'change-grade' && verdict.kind === 'wrong-grade' && verdict.detectedGrade) {
          gradedAs = verdict.detectedGrade;
          setGrade(gradedAs);
          if (profile) await saveProfile({ ...profile, grade: gradedAs });
        }
      }

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
        grade: gradedAs,
        pages,
        engine,
      };
      if (graded.duplicatePages?.length) {
        const pagesText = graded.duplicatePages.join(', ');
        setNotice({
          id: Date.now(),
          title: 'Có trang chụp trùng',
          message: `Trang ${pagesText} giống trang trước nên cô chỉ chấm một lần thôi nhé.`,
        });
      }
      setLatest(entry);
      setLatestReward(null);
      setPhotos([]);
      speak(graded.spokenFeedback);
      await addHistoryEntry(entry);
      // Mỗi bài chấm xong được +15 sao; lỗi lưu sao thì vẫn giữ kết quả chấm.
      await recordGrading()
        .then(setLatestReward)
        .catch((error) => console.warn('Chưa lưu được sao thưởng:', error));
      return true;
    } catch (error) {
      if (error instanceof GradingError && error.code === 'het-luot') {
        // Hết lượt hôm nay: gói Miễn phí thì mời ba mẹ xem gói Plus (qua cổng phụ huynh).
        Alert.alert(
          'Hôm nay con giỏi lắm! 🌟',
          error.message,
          error.plus
            ? [{ text: 'Vâng ạ' }]
            : [{ text: 'Mai con chấm tiếp', style: 'cancel' }, { text: 'Ba mẹ xem gói Plus', onPress: () => router.push('/goi-plus') }],
        );
        return false;
      }
      // Lý do cụ thể chỉ ghi vào log; ba mẹ và bé thấy một lời nhắn chung, dễ hiểu.
      console.warn('Chưa chấm được bài:', error);
      Alert.alert(
        'Kết nối đang có vấn đề',
        'Bố mẹ vui lòng kiểm tra lại Internet và thử lại sau nhé.',
        [{ text: 'Đã hiểu' }],
      );
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
        latestReward,
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
