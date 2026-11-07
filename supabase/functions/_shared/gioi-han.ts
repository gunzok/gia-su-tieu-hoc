// Luật chọn AI và giới hạn cho bản web. Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
//
// Người dùng bản web (trình duyệt luôn gửi header Origin; app điện thoại thì không) chưa có gói Plus
// chỉ được dùng AI miễn phí (Gemini). Claude và mọi AI trả phí chỉ dành cho Plus (GIA-68).

export type Engine = 'gemini' | 'claude';

/** Yêu cầu đến từ trình duyệt (bản web). Header Origin do trình duyệt tự gắn, trang web không giả được. */
export function isBrowserRequest(origin: string | null | undefined) {
  return !!origin;
}

/** Thứ tự AI cho người này: người dùng web chưa Plus chỉ còn AI miễn phí. */
export function engineOrderFor(order: Engine[], who: { plus: boolean; browser: boolean }): Engine[] {
  if (who.browser && !who.plus) return order.filter((engine) => engine === 'gemini');
  return order;
}

/** Đọc số nguyên dương từ secret; sai hoặc thiếu thì dùng mặc định. */
export function limitFrom(value: string | undefined, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

/** Số lượt mỗi ngày cho một loại yêu cầu của người dùng web. */
export const WEB_DAILY = {
  // Lượt "Hỏi cô"
  askFree: 10,
  askPlus: 100,
  // Lượt tạo giọng đọc mới (câu đã có sẵn trong kho không tính)
  voiceFree: 30,
  voicePlus: 200,
} as const;

/** Tổng lượt chấm toàn hệ thống mỗi ngày mà bản web còn nhận (cầu dao chống chi phí vượt tầm). */
export const GLOBAL_GRADING_DAILY_DEFAULT = 300;

/**
 * Danh sách mời (GIA-69): khi bật (secret WEB_CHI_NGUOI_DUOC_MOI=true), người dùng web phải đăng nhập thật
 * (không phải ẩn danh) và có email trong bảng moi_dung_thu. App điện thoại không bị ảnh hưởng.
 * Trả null nếu được dùng, hoặc mã lý do bị từ chối.
 */
export type InviteProblem = 'can-dang-nhap' | 'chua-duoc-moi';

export function inviteDecision(input: {
  enforce: boolean;
  browser: boolean;
  anonymous: boolean;
  email: string | null | undefined;
  invitedEmails: string[];
}): InviteProblem | null {
  if (!input.enforce || !input.browser) return null;
  const email = input.email?.trim().toLowerCase();
  if (input.anonymous || !email) return 'can-dang-nhap';
  return input.invitedEmails.some((invited) => invited.trim().toLowerCase() === email) ? null : 'chua-duoc-moi';
}

export const INVITE_MESSAGES: Record<InviteProblem, string> = {
  'can-dang-nhap': 'Ba mẹ hãy đăng nhập bằng tài khoản của mình để dùng bản web nhé.',
  'chua-duoc-moi': 'Bản web đang dùng thử với một nhóm nhỏ. Tài khoản này chưa được mời, ba mẹ liên hệ để được thêm vào nhé.',
};
