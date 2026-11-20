import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { speakable } from '@/lib/grading';
import { getPremiumStatus } from '@/lib/payments';
import { ensureSession, supabase } from '@/lib/supabase';
import type { TeacherId } from '@/lib/teacher';

// Phần chung của giọng đọc cho app và web (`speech.ts`, `speech.web.ts`):
// - Giọng AI tự nhiên của Google (hàm "doc-loi" trên Supabase tạo file âm thanh).
// - Mất mạng, máy chủ lỗi hoặc hết phần miễn phí tháng này: giọng tiếng Việt có sẵn trên máy, mỗi nền tảng
//   tự lo (`DeviceVoice`).

export type SpeakCallbacks = {
  onDone?: () => void;
  /**
   * Máy không có giọng tiếng Việt nên không đọc (chỉ bản web: trình duyệt thiếu giọng vi-VN).
   * `onDone` vẫn được gọi ngay sau đó để nút loa không kẹt.
   */
  onNoVoice?: () => void;
};

export type DeviceVoice = {
  /** Đọc `spoken` (đã sửa cho dễ đọc). `isCurrent()` trả false khi đã có lượt đọc mới hoặc bấm dừng. */
  speak: (spoken: string, callbacks: SpeakCallbacks | undefined, teacher: TeacherId, isCurrent: () => boolean) => Promise<void>;
  stop: () => void;
};

// Tạm thời mọi người đều nghe giọng Google (máy chủ tự dừng khi gần hết 1 triệu ký tự miễn phí/tháng).
// Khi RevenueCat có khoá thật, đổi thành false để chỉ gói Plus được nghe giọng Google.
const CLOUD_VOICE_FOR_ALL = true;

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

// ---------- Giọng AI của Google ----------
const cloudTimeoutMs = 12_000;
// Link âm thanh máy chủ trả về còn hạn 1 giờ; giữ 50 phút để nghe lại không phải hỏi máy chủ.
const urlLifetimeMs = 50 * 60 * 1000;
const cloudUrls = new Map<string, { url: string; at: number }>();
// Máy chủ báo hết lượt miễn phí tháng này: dùng giọng máy cho tới khi mở lại app.
let cloudQuotaReached = false;

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
  if (error) {
    // Lỗi HTTP từ hàm có kèm Response gốc; 429 nghĩa là hết lượt miễn phí tháng này.
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 429) cloudQuotaReached = true;
    throw error;
  }
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

/** Tạo cặp hàm `speakVietnamese` / `stopSpeaking` với giọng trên máy của từng nền tảng. */
export function createSpeech(device: DeviceVoice) {
  function stopSpeaking() {
    turn += 1;
    device.stop();
    if (player) finishPlayer(player);
  }

  async function speakVietnamese(text: string, callbacks?: SpeakCallbacks, teacher: TeacherId = 'co') {
    stopSpeaking();
    const myTurn = turn;
    const spoken = speakable(naturalSpeech(text));
    if (!spoken) {
      callbacks?.onDone?.();
      return;
    }

    if (!cloudQuotaReached && (CLOUD_VOICE_FOR_ALL || (await getPremiumStatus()).isPremium)) {
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

    await device.speak(spoken, callbacks, teacher, () => myTurn === turn);
  }

  return { speakVietnamese, stopSpeaking };
}
