import {
  engineOrderFor,
  GLOBAL_DAILY_DEFAULTS,
  GLOBAL_GRADING_DAILY_DEFAULT,
  globalBreakerTripped,
  globalLimitFor,
  inviteDecision,
  isBrowserRequest,
  limitFrom,
} from '../../../supabase/functions/_shared/gioi-han';

describe('engineOrderFor (GIA-68, GIA-84)', () => {
  const full = ['gemini', 'claude'] as const;

  it('chưa Plus (web hay app, có hay không Origin) chỉ được AI miễn phí, không bao giờ gọi Claude', () => {
    expect(engineOrderFor([...full], { plus: false })).toEqual(['gemini']);
    expect(engineOrderFor(['claude', 'gemini'], { plus: false })).toEqual(['gemini']);
  });

  it('chưa Plus mà không có Gemini thì không có AI nào (không dùng Claude thay thế)', () => {
    expect(engineOrderFor(['claude'], { plus: false })).toEqual([]);
  });

  it('Plus giữ nguyên thứ tự AI: Claude vẫn dự phòng khi Gemini lỗi', () => {
    expect(engineOrderFor([...full], { plus: true })).toEqual(['gemini', 'claude']);
    expect(engineOrderFor(['claude', 'gemini'], { plus: true })).toEqual(['claude', 'gemini']);
  });
});

describe('cầu dao tổng (GIA-84)', () => {
  const web = GLOBAL_GRADING_DAILY_DEFAULT;
  const all = GLOBAL_DAILY_DEFAULTS.gradingAll;

  it('yêu cầu không có Origin (app hoặc script) vẫn bị tính cầu dao, theo ngưỡng tổng', () => {
    const limit = globalLimitFor({ browser: isBrowserRequest(null), webLimit: web, allLimit: all });
    expect(limit).toBe(all);
    expect(globalBreakerTripped(all - 1, limit)).toBe(false);
    expect(globalBreakerTripped(all, limit)).toBe(true);
  });

  it('web dùng ngưỡng web, nhưng không bao giờ vượt ngưỡng tổng', () => {
    expect(globalLimitFor({ browser: true, webLimit: 300, allLimit: 600 })).toBe(300);
    expect(globalLimitFor({ browser: true, webLimit: 900, allLimit: 600 })).toBe(600);
    expect(globalLimitFor({ browser: true, allLimit: 1000 })).toBe(1000);
  });

  it('không đếm được tổng lượt (lỗi máy chủ) thì coi như cầu dao đã nhảy', () => {
    expect(globalBreakerTripped(null, 600)).toBe(true);
    expect(globalBreakerTripped(undefined, 600)).toBe(true);
    expect(globalBreakerTripped(0, 600)).toBe(false);
  });

  it('mặc định an toàn: ngưỡng tổng lớn hơn ngưỡng web', () => {
    expect(all).toBeGreaterThan(web);
    expect(GLOBAL_DAILY_DEFAULTS.askAll).toBeGreaterThan(0);
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
