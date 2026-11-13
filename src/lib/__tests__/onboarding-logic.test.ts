import { effectiveTeacher, GRADE_OPTIONS } from '@/lib/use-profile-form';
import { normalizeEmail } from '@/lib/use-parent-login';

// Chỉ thử phần logic thuần; các module nối máy chủ, thanh toán, giọng đọc được thay bằng bản giả.
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false } }));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn(), sendEmailCode: jest.fn(), verifyEmailCode: jest.fn(), signInWithGoogle: jest.fn() }));
jest.mock('@/lib/profile', () => ({ avatarOptions: [{ id: 'be-trai', emoji: '👦', label: 'Bé trai' }], useProfile: jest.fn() }));
jest.mock('@/lib/payments', () => ({ usePremium: jest.fn(), purchaseErrorMessage: jest.fn() }));
jest.mock('@/lib/speech', () => ({ speakVietnamese: jest.fn() }));

describe('normalizeEmail', () => {
  it('bỏ khoảng trắng và đổi chữ thường', () => {
    expect(normalizeEmail('  Ba.Me@Gmail.COM ')).toBe('ba.me@gmail.com');
  });

  it('trả null khi sai định dạng', () => {
    expect(normalizeEmail('khong-phai-email')).toBeNull();
    expect(normalizeEmail('a@b')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });
});

describe('effectiveTeacher', () => {
  it('chưa có gói Plus thì luôn là Cô giáo', () => {
    expect(effectiveTeacher('thay', false)).toBe('co');
    expect(effectiveTeacher('co', false)).toBe('co');
  });

  it('có gói Plus thì giữ lựa chọn', () => {
    expect(effectiveTeacher('thay', true)).toBe('thay');
  });
});

describe('GRADE_OPTIONS', () => {
  it('đủ lớp 1 đến 5, mỗi lớp có gợi ý', () => {
    expect(GRADE_OPTIONS.map((option) => option.grade)).toEqual([1, 2, 3, 4, 5]);
    expect(GRADE_OPTIONS.every((option) => option.hint.length > 0)).toBe(true);
  });
});
