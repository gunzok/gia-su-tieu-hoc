import { useEffect, useState } from 'react';

// Khung cho phần thanh toán bằng RevenueCat. CHƯA cài SDK (react-native-purchases cần bản app
// build riêng, không chạy trong Expo Go), nên hiện mọi người đều dùng gói Miễn phí.
// Các bước cài thật: xem docs/thanh-toan-revenuecat.md.

/** Tên "entitlement" đặt trong RevenueCat cho gói trả phí. */
export const PREMIUM_ENTITLEMENT = 'premium';

export type Plan = {
  id: 'free' | 'premium';
  name: string;
  perks: string[];
};

// Bản nháp quyền lợi từng gói, chỉnh lại khi quyết định giá bán.
export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Miễn phí',
    perks: ['Chấm bài bằng LM Studio ở nhà', 'Lưu lịch sử chấm bài trên máy'],
  },
  {
    id: 'premium',
    name: 'Gia sư Tiểu học Plus',
    perks: ['Chấm bài bằng Claude ở mọi nơi', 'Chọn học cùng Thầy giáo hoặc Cô giáo', 'Lưu kết quả lên máy chủ, xem trên nhiều máy', 'Báo cáo tiến độ đầy đủ cho ba mẹ'],
  },
];

export type PremiumStatus = {
  /** true khi đã mua gói trả phí. */
  isPremium: boolean;
  /** Đã nối RevenueCat chưa; false nghĩa là chưa bán gì trong app. */
  storeReady: boolean;
};

/**
 * Trạng thái gói của người dùng hiện tại. Khi cài RevenueCat: gọi
 * Purchases.getCustomerInfo() và kiểm tra customerInfo.entitlements.active[PREMIUM_ENTITLEMENT].
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  // Chỉ để thử các tính năng Plus khi đang phát triển: EXPO_PUBLIC_DEV_PLUS=1 trong .env.local.
  // Bản phát hành (__DEV__ = false) luôn bỏ qua dòng này.
  if (__DEV__ && process.env.EXPO_PUBLIC_DEV_PLUS === '1') return { isPremium: true, storeReady: false };
  return { isPremium: false, storeReady: false };
}

/**
 * Khi cài RevenueCat: gọi Purchases.configure({ apiKey, appUserID: <id người dùng Supabase> })
 * ngay sau khi đăng nhập, để giao dịch gắn với đúng tài khoản ba mẹ.
 */
export async function linkPurchasesToUser(_supabaseUserId: string) {}

export async function purchasePremium(): Promise<never> {
  throw new Error('Gói trả phí chưa mở bán.');
}

/** Có gói Plus không (đọc một lần khi màn hình mở). */
export function useIsPremium() {
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    getPremiumStatus().then((status) => setIsPremium(status.isPremium));
  }, []);
  return isPremium;
}
