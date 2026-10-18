import * as Speech from 'expo-speech';

import type { TeacherId } from '@/lib/teacher';

// Máy không cho biết giọng nào là nam hay nữ, nên: thầy dùng giọng tiếng Việt thứ hai
// nếu máy có (thường là giọng khác giới), và hạ cao độ cho trầm hơn; cô dùng giọng đầu tiên.
const voiceSettings: Record<TeacherId, { pitch: number; voiceIndex: number }> = {
  co: { pitch: 1.05, voiceIndex: 0 },
  thay: { pitch: 0.8, voiceIndex: 1 },
};

let vietnameseVoices: Promise<string[]> | null = null;

function loadVietnameseVoices() {
  vietnameseVoices ??= Speech.getAvailableVoicesAsync()
    .then((voices) =>
      voices.filter((voice) => voice.language.toLowerCase().startsWith('vi')).map((voice) => voice.identifier),
    )
    .catch(() => []);
  return vietnameseVoices;
}

export async function speakVietnamese(
  text: string,
  callbacks?: { onDone?: () => void },
  teacher: TeacherId = 'co',
) {
  Speech.stop();
  const settings = voiceSettings[teacher];
  const voices = await loadVietnameseVoices();
  Speech.speak(text, {
    language: 'vi-VN',
    rate: 0.9,
    pitch: settings.pitch,
    voice: voices[settings.voiceIndex],
    onDone: callbacks?.onDone,
    onStopped: callbacks?.onDone,
    onError: callbacks?.onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
