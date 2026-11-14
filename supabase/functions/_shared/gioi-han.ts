// Luật chọn AI và giới hạn lượt. Không import gì để cả Deno (Supabase) lẫn jest (app) đọc được.
//
// Claude (trả phí) chỉ dành cho người có gói Plus, dù gọi từ web hay app (GIA-68, GIA-84). Header Origin
// chỉ nói yêu cầu đến từ trình duyệt; script tự viết bỏ Origin được, nên luật chi phí không dựa vào nó.

export type Engine = 'gemini' | 'claude';

/** Yêu cầu đến từ trình duyệt (bản web). Header Origin do trình duyệt tự gắn, trang web không giả được. */
export function isBrowserRequest(origin: string | null | undefined) {
  return !!origin;
}

/**
 * Thứ tự AI cho người này: chưa Plus thì chỉ còn AI miễn phí (Gemini), không bao giờ rơi sang Claude,
 * kể cả khi gọi từ app (không có Origin). Plus giữ nguyên thứ tự (Claude dự phòng khi Gemini lỗi).
 */
export function engineOrderFor(order: Engine[], who: { plus: boolean }): Engine[] {
  if (!who.plus) return order.filter((engine) => engine === 'gemini');
  return order;
}

/** Đọc số nguyên dương từ secret; sai hoặc thiếu thì dùng mặc định. */
export function limitFrom(value: string | undefined, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

/** Số lượt mỗi ngày cho một người. Lượt "Hỏi cô" áp cho mọi yêu cầu (GIA-84); giọng đọc chỉ áp cho web. */
export const WEB_DAILY = {
  // Lượt "Hỏi cô"
  askFree: 10,
  askPlus: 100,
  // Lượt tạo giọng đọc mới (câu đã có sẵn trong kho không tính)
  voiceFree: 30,
  voicePlus: 200,
} as const;

/** Tổng lượt chấm toàn hệ thống mỗi ngày mà bản web còn nhận (secret GIOI_HAN_CHUNG_NGAY). */
export const GLOBAL_GRADING_DAILY_DEFAULT = 300;

/**
 * Cầu dao tổng cho MỌI yêu cầu, web lẫn app (GIA-84). Yêu cầu không có Origin (app hoặc script tự viết)
 * không còn thoát cầu dao. Đổi bằng secret; sai hoặc thiếu thì dùng mặc định.
 */
export const GLOBAL_DAILY_DEFAULTS = {
  /** Tổng lượt chấm mỗi ngày cho mọi yêu cầu (secret GIOI_HAN_TONG_NGAY). */
  gradingAll: 600,
  /** Tổng lượt "Hỏi cô" mỗi ngày cho mọi yêu cầu (secret GIOI_HAN_HOI_CO_NGAY). */
  askAll: 1000,
} as const;

/** Ngưỡng cầu dao cho một yêu cầu: web dùng ngưỡng web nhưng không bao giờ vượt ngưỡng tổng. */
export function globalLimitFor(input: { browser: boolean; webLimit?: number; allLimit: number }) {
  if (input.browser && input.webLimit !== undefined) return Math.min(input.webLimit, input.allLimit);
  return input.allLimit;
}

/** Cầu dao đã nhảy chưa. Không đếm được (lỗi máy chủ) thì coi như đã nhảy cho an toàn chi phí. */
export function globalBreakerTripped(totalToday: number | null | undefined, limit: number) {
  if (typeof totalToday !== 'number') return true;
  return totalToday >= limit;
}

/** Lời báo khi cầu dao nhảy hoặc AI miễn phí bận; app và web đều hiện được (mã 503). */
export const BUSY_MESSAGES = {
  quaTai: 'Hôm nay cô đang rất đông bạn nhỏ, con quay lại chấm vào ngày mai nhé!',
  quaTaiHoi: 'Hôm nay cô đang rất đông bạn nhỏ, con quay lại hỏi vào ngày mai nhé!',
  ban: 'Cô đang hơi bận, con thử lại sau ít phút nhé!',
} as const;

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
