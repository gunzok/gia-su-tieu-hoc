import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { createSpeech, naturalSpeech, type SpeakCallbacks } from '@/lib/speech-core';
import type { TeacherId } from '@/lib/teacher';

// Cô/thầy đọc lời nhận xét thành tiếng (app điện thoại). Giọng AI của máy chủ và phần chung nằm ở
// `speech-core.ts`; file này lo giọng tiếng Việt có sẵn trên máy (expo-speech). Bản web: `speech.web.ts`.

export { naturalSpeech };
export type { SpeakCallbacks };

// ---------- Giọng có sẵn trên máy ----------
// - Chọn giọng chất lượng cao (Enhanced) nếu máy có. iPhone: Cài đặt > Trợ năng > Nội dung được đọc
//   > Giọng nói > Tiếng Việt > tải "Linh (Nâng cao)".
// - Giữ cao độ gần mức gốc: chỉnh cao độ nhiều làm giọng méo, nghe như máy.
// Máy không cho biết giọng nào là nam hay nữ, nên thầy dùng giọng tiếng Việt thứ hai nếu máy có
// (thường là giọng khác giới) và hạ cao độ một chút; cô dùng giọng tốt nhất.
const voiceSettings: Record<TeacherId, { pitch: number; voiceIndex: number }> = {
  co: { pitch: 1.0, voiceIndex: 0 },
  thay: { pitch: 0.92, voiceIndex: 1 },
};

// Nhanh hơn một chút so với trước (0.9) để không nghe như đọc từng chữ, vẫn đủ chậm cho bé.
const rate = Platform.OS === 'ios' ? 0.96 : 0.95;

let vietnameseVoices: Promise<string[]> | null = null;

function loadVietnameseVoices() {
  vietnameseVoices ??= Speech.getAvailableVoicesAsync()
    .then((voices) =>
      voices
        .filter((voice) => voice.language.toLowerCase().startsWith('vi'))
        // Giọng chất lượng cao lên trước.
        .sort(
          (a, b) =>
            Number(b.quality === Speech.VoiceQuality.Enhanced) - Number(a.quality === Speech.VoiceQuality.Enhanced),
        )
        .map((voice) => voice.identifier),
    )
    .catch(() => []);
  return vietnameseVoices;
}

export const { speakVietnamese, stopSpeaking } = createSpeech({
  async speak(spoken, callbacks, teacher, isCurrent) {
    const settings = voiceSettings[teacher];
    const voices = await loadVietnameseVoices();
    if (!isCurrent()) return;
    Speech.speak(spoken, {
      language: 'vi-VN',
      rate,
      pitch: settings.pitch,
      voice: voices[settings.voiceIndex] ?? voices[0],
      onDone: callbacks?.onDone,
      onStopped: callbacks?.onDone,
      onError: callbacks?.onDone,
    });
  },
  stop: () => Speech.stop(),
});
