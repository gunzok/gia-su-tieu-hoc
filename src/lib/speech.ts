import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { speakable } from '@/lib/grading';
import { getPremiumStatus } from '@/lib/payments';
import { ensureSession, supabase } from '@/lib/supabase';
import type { TeacherId } from '@/lib/teacher';

// Cô/thầy đọc lời nhận xét thành tiếng:
// - Gói Plus: giọng AI tự nhiên của Google (hàm "doc-loi" trên Supabase tạo file âm thanh).
// - Gói miễn phí, mất mạng hoặc máy chủ lỗi: giọng tiếng Việt có sẵn trên máy (expo-speech).

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

// ---------- Giọng AI của Google (gói Plus) ----------
const cloudTimeoutMs = 12_000;
// Link âm thanh máy chủ trả về còn hạn 1 giờ; giữ 50 phút để nghe lại không phải hỏi máy chủ.
const urlLifetimeMs = 50 * 60 * 1000;
const cloudUrls = new Map<string, { url: string; at: number }>();

async function cloudVoiceUrl(text: string, teacher: TeacherId) {
  const key = `${teacher}|${text}`;
  const saved = cloudUrls.get(key);
  if (saved && Date.now() - saved.at < urlLifetimeMs) return saved.url;

  if (!supabase) throw new Error('Chưa cấu hình Supabase.');
  if (!(await ensureSession())) throw new Error('Chưa đăng nhập được Supabase.');
  const { data, error } = await supabase.functions.invoke<{ url?: string }>('doc-loi', {
    body: { text, teacher },
    timeout: cloudTimeoutMs,
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Máy chủ không trả về giọng đọc.');
  cloudUrls.set(key, { url: data.url, at: Date.now() });
  return data.url;
}

let audioModeReady: Promise<void> | null = null;
let player: AudioPlayer | null = null;
let playerDone: (() => void) | undefined;
// Mỗi lần đọc mới (hoặc bấm dừng) tăng lên 1; lượt cũ đang chờ máy chủ thấy khác số thì bỏ.
let turn = 0;

function finishPlayer(target: AudioPlayer) {
  if (player !== target) return;
  player = null;
  target.remove();
  const done = playerDone;
  playerDone = undefined;
  done?.();
}

async function playUrl(url: string, onDone?: () => void) {
  // Vẫn phát tiếng khi iPhone gạt chế độ im lặng.
  audioModeReady ??= setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  await audioModeReady;
  const next = createAudioPlayer(url);
  player = next;
  playerDone = onDone;
  next.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) finishPlayer(next);
  });
  next.play();
}

// ---------- Dùng trong app ----------

export async function speakVietnamese(
  text: string,
  callbacks?: { onDone?: () => void },
  teacher: TeacherId = 'co',
) {
  stopSpeaking();
  const myTurn = turn;
  const spoken = speakable(naturalSpeech(text));
  if (!spoken) {
    callbacks?.onDone?.();
    return;
  }

  if ((await getPremiumStatus()).isPremium) {
    try {
      const url = await cloudVoiceUrl(spoken, teacher);
      if (myTurn !== turn) return;
      await playUrl(url, callbacks?.onDone);
      return;
    } catch (error) {
      // Không sao: đọc bằng giọng trên máy.
      console.warn('Chưa dùng được giọng AI, đọc bằng giọng trên máy:', error);
      if (myTurn !== turn) return;
    }
  }

  const settings = voiceSettings[teacher];
  const voices = await loadVietnameseVoices();
  if (myTurn !== turn) return;
  Speech.speak(spoken, {
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
  turn += 1;
  Speech.stop();
  if (player) finishPlayer(player);
}
