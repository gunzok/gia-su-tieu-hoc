import { cleanEmailCode, isValidEmailCode } from '@/lib/email-code';

describe('mã đăng nhập email', () => {
  it('nhận mã 8 số như Supabase đang gửi', () => {
    expect(isValidEmailCode('31459512')).toBe(true);
  });

  it('vẫn nhận mã 6 số nếu đổi cài đặt', () => {
    expect(isValidEmailCode('314595')).toBe(true);
  });

  it('từ chối mã quá ngắn hoặc có chữ', () => {
    expect(isValidEmailCode('31459')).toBe(false);
    expect(isValidEmailCode('3145a512')).toBe(false);
  });

  it('dán mã có dấu cách vẫn giữ đủ 8 số', () => {
    expect(cleanEmailCode('3145 9512')).toBe('31459512');
    expect(cleanEmailCode('12345678901234')).toBe('1234567890');
  });
});
