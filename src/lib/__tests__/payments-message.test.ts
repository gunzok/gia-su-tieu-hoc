// GSTH-040: lời báo lỗi thanh toán cho ba mẹ không được chứa chữ kỹ thuật.
import { PAYMENT_UNAVAILABLE_MESSAGE, purchaseErrorMessage } from '@/lib/payments';

// jest.mock được đưa lên trước import khi chạy test.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {},
  LOG_LEVEL: {},
  PURCHASES_ERROR_CODE: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    PURCHASE_NOT_ALLOWED_ERROR: 'PURCHASE_NOT_ALLOWED_ERROR',
    PAYMENT_PENDING_ERROR: 'PAYMENT_PENDING_ERROR',
    PRODUCT_ALREADY_PURCHASED_ERROR: 'PRODUCT_ALREADY_PURCHASED_ERROR',
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
  },
}));
jest.mock('react-native-purchases-ui', () => ({ __esModule: true, default: {} }));
jest.mock('@/lib/auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ supabase: null, ensureSession: jest.fn() }));

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('purchaseErrorMessage', () => {
  it('lỗi lạ không lộ nguyên văn lời lỗi của thư viện', () => {
    const message = purchaseErrorMessage(new Error('RC_SDK_INTERNAL: EXPO_PUBLIC_REVENUECAT_API_KEY missing'));
    expect(message).toBe('Chưa thanh toán được, ba mẹ thử lại sau nhé.');
    expect(message).not.toMatch(/REVENUECAT|API_KEY|EXPO_PUBLIC|SDK/i);
  });

  it('chưa cấu hình thanh toán thì báo lời thân thiện, không có chữ kỹ thuật', () => {
    const message = purchaseErrorMessage(new Error(PAYMENT_UNAVAILABLE_MESSAGE));
    expect(message).toBe(PAYMENT_UNAVAILABLE_MESSAGE);
    expect(message).not.toMatch(/REVENUECAT|API_KEY|EXPO_PUBLIC|cấu hình/i);
  });

  it('mất mạng báo bằng lời dễ hiểu', () => {
    expect(purchaseErrorMessage({ code: 'NETWORK_ERROR' })).toMatch(/kết nối mạng/);
  });
});
