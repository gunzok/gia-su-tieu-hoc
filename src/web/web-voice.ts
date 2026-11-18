// Kiểm trình duyệt có giọng đọc tiếng Việt (Web Speech API) không.
// Cô đọc bằng giọng AI của máy chủ trước; khi máy chủ không đọc được thì mới dùng giọng của trình duyệt,
// nên trình duyệt thiếu giọng tiếng Việt chỉ cần báo nhẹ, không chặn bé dùng.
//
// Đã thử 18/11/2026 trên máy Mac (macOS có giọng "Linh"): Chrome, Chromium và WebKit (Safari) đều có
// giọng vi-VN "Linh". Firefox, Edge dùng giọng của hệ điều hành nên máy nào có "Linh" thì có.

export type VoiceSupport = 'co' | 'khong' | 'khong-ho-tro';

/** Chờ danh sách giọng tối đa chừng này (Chrome nạp giọng chậm, Safari có khi không báo voiceschanged). */
const WAIT_MS = 1500;

let cached: Promise<VoiceSupport> | null = null;

function hasVietnamese(voices: SpeechSynthesisVoice[]) {
  return voices.some((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith('vi'));
}

export function vietnameseVoiceSupport(): Promise<VoiceSupport> {
  cached ??= new Promise<VoiceSupport>((resolve) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof synth.getVoices !== 'function') {
      resolve('khong-ho-tro');
      return;
    }
    const first = synth.getVoices();
    if (first.length) {
      resolve(hasVietnamese(first) ? 'co' : 'khong');
      return;
    }
    const finish = () => {
      synth.removeEventListener?.('voiceschanged', finish);
      clearTimeout(timer);
      resolve(hasVietnamese(synth.getVoices()) ? 'co' : 'khong');
    };
    const timer = setTimeout(finish, WAIT_MS);
    synth.addEventListener?.('voiceschanged', finish);
  });
  return cached;
}

/** Chỉ dùng trong test. */
export function resetVoiceSupportCache() {
  cached = null;
}

/**
 * Thời gian tối đa chờ cô đọc xong một đoạn: quá thời gian này thì coi như đã xong,
 * để nút loa không kẹt ở trạng thái "đang đọc" khi trình duyệt không báo đọc xong.
 */
export function speakTimeoutMs(text: string) {
  // Khoảng 12 ký tự mỗi giây khi đọc chậm cho bé, cộng thời gian chờ máy chủ tạo giọng.
  return 15_000 + Math.ceil(text.length / 12) * 1000;
}
