// Danh sách giọng đọc của trình duyệt (Web Speech API), dùng chung cho `speech.web.ts` và màn Hỏi cô bản web.
// Trình duyệt thiếu giọng tiếng Việt thì không đọc (giọng tiếng Anh đọc chữ Việt nghe sai), chỉ báo nhẹ (GIA-74, GIA-87).
//
// Đã thử 18/11/2026 trên máy Mac (macOS có giọng "Linh"): Chrome, Chromium và WebKit (Safari) đều có
// giọng vi-VN "Linh". Firefox, Edge dùng giọng của hệ điều hành nên máy nào có "Linh" thì có.

/** Chờ danh sách giọng tối đa chừng này (Chrome nạp giọng chậm, Safari có khi không báo voiceschanged). */
const WAIT_MS = 1500;

let cached: Promise<SpeechSynthesisVoice[] | null> | null = null;

function synthesis(): SpeechSynthesis | undefined {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  return synth && typeof synth.getVoices === 'function' ? synth : undefined;
}

function isVietnamese(voice: SpeechSynthesisVoice) {
  return voice.lang.toLowerCase().replace('_', '-').startsWith('vi');
}

/** Giọng tiếng Việt của trình duyệt; `null` khi trình duyệt không có Web Speech. */
export function vietnameseBrowserVoices(): Promise<SpeechSynthesisVoice[] | null> {
  cached ??= new Promise((resolve) => {
    const synth = synthesis();
    if (!synth) {
      resolve(null);
      return;
    }
    const first = synth.getVoices();
    if (first.length) {
      resolve(first.filter(isVietnamese));
      return;
    }
    const finish = () => {
      synth.removeEventListener?.('voiceschanged', finish);
      clearTimeout(timer);
      resolve(synth.getVoices().filter(isVietnamese));
    };
    const timer = setTimeout(finish, WAIT_MS);
    synth.addEventListener?.('voiceschanged', finish);
  });
  return cached;
}

/** Chỉ dùng trong test. */
export function resetBrowserVoicesCache() {
  cached = null;
}
