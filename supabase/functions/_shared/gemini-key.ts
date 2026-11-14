// Chọn khoá Gemini theo gói (GIA-77). Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
//
// - Gói miễn phí: secret GEMINI_API_KEY (dự án Google Cloud chưa bật thanh toán, gói miễn phí của Gemini).
// - Gói Plus: secret GEMINI_API_KEY_TRA_PHI (dự án Google Cloud đã bật thanh toán). Chưa đặt thì
//   tạm dùng khoá miễn phí, để Plus không bị ngừng chấm.
// Gói miễn phí không bao giờ dùng khoá trả phí: chi phí trả phí chỉ phát sinh cho người đã mua Plus.

export type GeminiKeyTier = 'free' | 'paid';
export type GeminiKey = { key: string; tier: GeminiKeyTier };
export type GeminiKeys = { free?: string; paid?: string };

const clean = (value: string | undefined) => value?.trim() || undefined;

/** Đọc hai secret khoá Gemini. Trống hoặc chỉ có khoảng trắng thì coi như chưa đặt. */
export function readGeminiKeys(get: (name: string) => string | undefined): GeminiKeys {
  return { free: clean(get('GEMINI_API_KEY')), paid: clean(get('GEMINI_API_KEY_TRA_PHI')) };
}

/** Khoá dùng cho người này; null khi không có khoá nào dùng được (bỏ Gemini khỏi thứ tự AI). */
export function geminiKeyFor(plus: boolean, keys: GeminiKeys): GeminiKey | null {
  const paid = clean(keys.paid);
  const free = clean(keys.free);
  if (plus && paid) return { key: paid, tier: 'paid' };
  if (free) return { key: free, tier: 'free' };
  return null;
}
