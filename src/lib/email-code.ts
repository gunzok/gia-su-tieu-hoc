// Mã đăng nhập Supabase gửi qua email: độ dài do cài đặt dự án Supabase quyết định
// (Auth → Email OTP Length, cho phép 6–10 số; dự án đang gửi 8 số). App nhận mọi độ dài
// hợp lệ để không phải sửa code mỗi khi đổi cài đặt.
export const EMAIL_CODE_MIN = 6;
export const EMAIL_CODE_MAX = 10;

/** Bỏ ký tự không phải số (dán từ email hay có dấu cách) và cắt bớt phần thừa. */
export function cleanEmailCode(text: string) {
  return text.replace(/\D/g, '').slice(0, EMAIL_CODE_MAX);
}

export function isValidEmailCode(code: string) {
  return code.length >= EMAIL_CODE_MIN && code.length <= EMAIL_CODE_MAX && /^\d+$/.test(code);
}
