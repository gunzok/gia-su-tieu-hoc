import { vietnameseBrowserVoices } from '@/lib/browser-voices';
import { createSpeech, naturalSpeech, type SpeakCallbacks } from '@/lib/speech-core';
import type { TeacherId } from '@/lib/teacher';

// Cô/thầy đọc lời nhận xét thành tiếng (bản web). Cùng API với `speech.ts`: giọng AI của máy chủ trước,
// máy chủ không đọc được thì dùng giọng tiếng Việt của trình duyệt (Web Speech API).
// Khác app: trình duyệt **không có giọng vi-VN** thì không đọc (giọng tiếng Anh đọc chữ Việt nghe sai, bé khó hiểu),
// gọi `onNoVoice` để màn hình báo nhẹ, rồi `onDone` để nút loa không kẹt (đề xuất ở GIA-74, làm ở GIA-87).

export { naturalSpeech };
export type { SpeakCallbacks };

// Giống app: thầy dùng giọng tiếng Việt thứ hai nếu có và hạ cao độ một chút.
const voiceSettings: Record<TeacherId, { pitch: number; voiceIndex: number }> = {
  co: { pitch: 1.0, voiceIndex: 0 },
  thay: { pitch: 0.92, voiceIndex: 1 },
};

const rate = 0.95;

export const { speakVietnamese, stopSpeaking } = createSpeech({
  async speak(spoken, callbacks, teacher, isCurrent) {
    const voices = await vietnameseBrowserVoices();
    if (!isCurrent()) return;
    if (!voices?.length) {
      console.warn('Trình duyệt chưa có giọng đọc tiếng Việt, bỏ qua đọc thành tiếng.');
      callbacks?.onNoVoice?.();
      callbacks?.onDone?.();
      return;
    }

    const settings = voiceSettings[teacher];
    const utterance = new SpeechSynthesisUtterance(spoken);
    // Gán hẳn giọng tiếng Việt: chỉ đặt `lang` thì trình duyệt có thể chọn giọng mặc định (tiếng Anh).
    utterance.voice = voices[settings.voiceIndex] ?? voices[0];
    utterance.lang = utterance.voice.lang;
    utterance.rate = rate;
    utterance.pitch = settings.pitch;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      callbacks?.onDone?.();
    };
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  },
  stop() {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  },
});
