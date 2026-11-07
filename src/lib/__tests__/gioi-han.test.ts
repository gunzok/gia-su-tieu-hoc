import {
  engineOrderFor,
  inviteDecision,
  isBrowserRequest,
  limitFrom,
} from '../../../supabase/functions/_shared/gioi-han';

describe('engineOrderFor (GIA-68)', () => {
  const full = ['gemini', 'claude'] as const;

  it('người dùng web chưa Plus chỉ được AI miễn phí, không rơi sang Claude', () => {
    expect(engineOrderFor([...full], { plus: false, browser: true })).toEqual(['gemini']);
    expect(engineOrderFor(['claude', 'gemini'], { plus: false, browser: true })).toEqual(['gemini']);
  });

  it('web chưa Plus mà không có Gemini thì không có AI nào (không dùng Claude thay thế)', () => {
    expect(engineOrderFor(['claude'], { plus: false, browser: true })).toEqual([]);
  });

  it('Plus trên web và người dùng điện thoại giữ nguyên thứ tự AI', () => {
    expect(engineOrderFor([...full], { plus: true, browser: true })).toEqual(['gemini', 'claude']);
    expect(engineOrderFor([...full], { plus: false, browser: false })).toEqual(['gemini', 'claude']);
  });
});

describe('isBrowserRequest', () => {
  it('có header Origin là trình duyệt, không có là app điện thoại', () => {
    expect(isBrowserRequest('https://gst.example.com')).toBe(true);
    expect(isBrowserRequest(null)).toBe(false);
    expect(isBrowserRequest('')).toBe(false);
    expect(isBrowserRequest(undefined)).toBe(false);
  });
});

describe('limitFrom', () => {
  it('đọc số nguyên dương, sai hoặc thiếu thì dùng mặc định', () => {
    expect(limitFrom('500', 300)).toBe(500);
    expect(limitFrom(undefined, 300)).toBe(300);
    expect(limitFrom('abc', 300)).toBe(300);
    expect(limitFrom('0', 300)).toBe(300);
    expect(limitFrom('-5', 300)).toBe(300);
    expect(limitFrom('2.5', 300)).toBe(300);
  });
});


describe('inviteDecision (GIA-69)', () => {
  const base = { enforce: true, browser: true, anonymous: false, email: 'ba.me@gmail.com', invitedEmails: ['ba.me@gmail.com'] };

  it('người trong danh sách (không phân biệt hoa thường) được dùng', () => {
    expect(inviteDecision(base)).toBeNull();
    expect(inviteDecision({ ...base, email: ' Ba.Me@Gmail.com ' })).toBeNull();
  });

  it('email ngoài danh sách bị từ chối lịch sự', () => {
    expect(inviteDecision({ ...base, email: 'la@gmail.com' })).toBe('chua-duoc-moi');
  });

  it('tài khoản ẩn danh hoặc không có email phải đăng nhập thật', () => {
    expect(inviteDecision({ ...base, anonymous: true })).toBe('can-dang-nhap');
    expect(inviteDecision({ ...base, email: null })).toBe('can-dang-nhap');
  });

  it('không áp dụng cho app điện thoại hoặc khi chưa bật', () => {
    expect(inviteDecision({ ...base, browser: false, anonymous: true })).toBeNull();
    expect(inviteDecision({ ...base, enforce: false, anonymous: true })).toBeNull();
  });
});
