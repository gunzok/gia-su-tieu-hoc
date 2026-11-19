// Kiểm trình duyệt có giọng đọc tiếng Việt (Web Speech API) không.
// Cô đọc bằng giọng AI của máy chủ trước; khi máy chủ không đọc được thì mới dùng giọng của trình duyệt,
// nên trình duyệt thiếu giọng tiếng Việt chỉ cần báo nhẹ, không chặn bé dùng.
// Danh sách giọng lấy ở `@/lib/browser-voices` (dùng chung với `src/lib/speech.web.ts`).

import { resetBrowserVoicesCache, vietnameseBrowserVoices } from '@/lib/browser-voices';

export type VoiceSupport = 'co' | 'khong' | 'khong-ho-tro';

export async function vietnameseVoiceSupport(): Promise<VoiceSupport> {
  const voices = await vietnameseBrowserVoices();
  if (!voices) return 'khong-ho-tro';
  return voices.length ? 'co' : 'khong';
}

/** Chỉ dùng trong test. */
export function resetVoiceSupportCache() {
  resetBrowserVoicesCache();
}

/**
 * Thời gian tối đa chờ cô đọc xong một đoạn: quá thời gian này thì coi như đã xong,
 * để nút loa không kẹt ở trạng thái "đang đọc" khi trình duyệt không báo đọc xong.
 */
export function speakTimeoutMs(text: string) {
  // Khoảng 12 ký tự mỗi giây khi đọc chậm cho bé, cộng thời gian chờ máy chủ tạo giọng.
  return 15_000 + Math.ceil(text.length / 12) * 1000;
}
