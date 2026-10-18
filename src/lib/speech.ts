import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { speakable } from '@/lib/grading';
import type { TeacherId } from '@/lib/teacher';

// Giọng đọc tiếng Việt có sẵn trên máy. Để nghe tự nhiên:
// - Chọn giọng chất lượng cao (Enhanced) nếu máy có. iPhone: Cài đặt > Trợ năng > Nội dung được đọc
//   > Giọng nói > Tiếng Việt > tải "Linh (Nâng cao)".
// - Giữ cao độ gần mức gốc: chỉnh cao độ nhiều làm giọng méo, nghe như máy.
// - Sửa lại chữ trước khi đọc (xem naturalSpeech) để máy ngắt hơi đúng chỗ.
//
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

/**
 * Sửa chữ cho dễ đọc thành lời: xuống dòng thành chỗ ngắt câu, bỏ emoji và ký hiệu,
 * "a)" đọc thành "a,", "1/2" đọc thành "1 phần 2".
 */
export function naturalSpeech(text: string) {
  return text
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/[*_#`"“”«»]/g, '')
    .replace(/(^|[\s(])([a-eA-E])\)\s*/g, '$1$2, ')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 phần $2')
    .replace(/\s*[→⇒]\s*/g, ', ')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    // Dòng không có dấu câu ở cuối thì thêm dấu chấm để máy dừng một nhịp.
    .map((line) => (/[.!?,:;…]$/.test(line) ? line : `${line}.`))
    .join(' ')
    .replace(/\s+([.!?,])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function speakVietnamese(
  text: string,
  callbacks?: { onDone?: () => void },
  teacher: TeacherId = 'co',
) {
  Speech.stop();
  const settings = voiceSettings[teacher];
  const voices = await loadVietnameseVoices();
  Speech.speak(speakable(naturalSpeech(text)), {
    language: 'vi-VN',
    rate,
    pitch: settings.pitch,
    voice: voices[settings.voiceIndex] ?? voices[0],
    onDone: callbacks?.onDone,
    onStopped: callbacks?.onDone,
    onError: callbacks?.onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
