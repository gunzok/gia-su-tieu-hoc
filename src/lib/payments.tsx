import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOfferings,
} from 'react-native-purchases';
import { router } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';

import { useAuth } from '@/lib/auth';

// Thanh toán bằng RevenueCat: gói "Gia sư Tiểu học Plus" (tháng / năm / trọn đời).
// - Trong Expo Go: SDK chạy chế độ xem thử (Paywall hiện được, không mua thật).
// - Mua thật cần bản build riêng (EAS development build). Hướng dẫn: docs/thanh-toan-revenuecat.md.

/** Entitlement mở khoá gói Plus; phải trùng đúng tên đặt trong RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'gia_sư_tiểu_học_pro';

/** Mã sản phẩm trong RevenueCat (Test Store / App Store / Google Play). */
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export const plusPerks = [
  'Chấm bài bằng Claude ở mọi nơi',
  'Chọn học cùng Thầy giáo hoặc Cô giáo',
  'Lưu kết quả lên máy chủ, xem trên nhiều máy',
];

// Chỉ để thử tính năng Plus khi phát triển: EXPO_PUBLIC_DEV_PLUS=1 trong .env.local.
// Bản phát hành (__DEV__ = false) luôn bỏ qua.
const devPlus = __DEV__ && process.env.EXPO_PUBLIC_DEV_PLUS === '1';

let configured = false;

/** Gọi một lần lúc mở app. Không có key thì bỏ qua: app chạy như gói Miễn phí. */
function configurePurchases() {
  if (configured || !apiKey) return configured;
  // Key Test Store (test_…) làm sập bản phát hành (RevenueCat cố ý). Bản không phải dev thì bỏ qua,
  // app chạy như gói Miễn phí cho tới khi thay bằng key iOS/Android thật.
  if (!__DEV__ && apiKey.startsWith('test_')) {
    console.warn('Bỏ qua RevenueCat: key Test Store không dùng được ở bản phát hành.');
    return false;
  }
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    configured = true;
  } catch (error) {
    console.warn('Chưa khởi tạo được RevenueCat:', error);
  }
  return configured;
}

export function hasPro(info: CustomerInfo | null) {
  return devPlus || !!info?.entitlements.active[PRO_ENTITLEMENT];
}

function isCancelled(error: unknown) {
  return (error as PurchasesError | undefined)?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

/** Lời báo lỗi dễ hiểu cho ba mẹ; null nếu ba mẹ tự huỷ (không cần báo). */
export function purchaseErrorMessage(error: unknown): string | null {
  if (isCancelled(error)) return null;
  const code = (error as PurchasesError | undefined)?.code;
  switch (code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'Mất kết nối mạng. Ba mẹ thử lại khi có Internet nhé.';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'Máy này chưa được phép mua hàng trong ứng dụng.';
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'Giao dịch đang chờ xác nhận. Gói Plus sẽ mở khi thanh toán xong.';
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return 'Ba mẹ đã mua gói này rồi. Bấm "Khôi phục giao dịch" để mở lại nhé.';
    default:
      return error instanceof Error ? error.message : 'Chưa thanh toán được, ba mẹ thử lại sau nhé.';
  }
}

type PremiumState = {
  /** Đã nối RevenueCat chưa (có key và khởi tạo được). */
  storeReady: boolean;
  customerInfo: CustomerInfo | null;
  isPremium: boolean;
  /** Mở màn Paywall (route "goi-plus"). Kết quả mua tự cập nhật qua isPremium. */
  showPaywall: () => void;
  /** Màn Paywall gọi sau khi mua / khôi phục để cập nhật ngay. */
  updateCustomerInfo: (info: CustomerInfo) => void;
  /** Màn quản lý gói (đổi gói, huỷ, hoàn tiền, khôi phục) của RevenueCat. */
  showCustomerCenter: () => Promise<void>;
  restore: () => Promise<boolean>;
  getOfferings: () => Promise<PurchasesOfferings | null>;
};

const PremiumContext = createContext<PremiumState | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [storeReady] = useState(configurePurchases);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Theo dõi thay đổi gói (mua, gia hạn, hết hạn, khôi phục) từ RevenueCat.
  useEffect(() => {
    if (!storeReady) return;
    Purchases.getCustomerInfo()
      .then(setCustomerInfo)
      .catch((error) => console.warn('Chưa đọc được thông tin gói:', error));
    Purchases.addCustomerInfoUpdateListener(setCustomerInfo);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(setCustomerInfo);
    };
  }, [storeReady]);

  // Gắn giao dịch với tài khoản Supabase (kể cả ẩn danh) để mua ở máy này, đăng nhập máy khác
  // vẫn có Plus. Đăng xuất thì về người dùng ẩn danh của RevenueCat.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!storeReady) return;
    (async () => {
      try {
        if (userId) {
          const { customerInfo: info } = await Purchases.logIn(userId);
          setCustomerInfo(info);
        } else if (!(await Purchases.isAnonymous())) {
          setCustomerInfo(await Purchases.logOut());
        }
      } catch (error) {
        console.warn('Chưa liên kết được tài khoản thanh toán:', error);
      }
    })();
  }, [storeReady, userId]);

  const showPaywall = useCallback(() => {
    if (!storeReady && !devPlus) throw new Error('Chưa cấu hình thanh toán (thiếu EXPO_PUBLIC_REVENUECAT_API_KEY).');
    router.push('/goi-plus');
  }, [storeReady]);

  const showCustomerCenter = useCallback(async () => {
    if (!storeReady) return;
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo: info }) => setCustomerInfo(info),
      },
    });
    setCustomerInfo(await Purchases.getCustomerInfo());
  }, [storeReady]);

  const restore = useCallback(async () => {
    if (!storeReady) return false;
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return hasPro(info);
  }, [storeReady]);

  const getOfferings = useCallback(async () => (storeReady ? Purchases.getOfferings() : null), [storeReady]);

  return (
    <PremiumContext.Provider
      value={{
        storeReady,
        customerInfo,
        isPremium: hasPro(customerInfo),
        showPaywall,
        updateCustomerInfo: setCustomerInfo,
        showCustomerCenter,
        restore,
        getOfferings,
      }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const state = useContext(PremiumContext);
  if (!state) throw new Error('usePremium phải nằm trong PremiumProvider');
  return state;
}

/** Có gói Plus không. */
export function useIsPremium() {
  return usePremium().isPremium;
}

/** Dùng ngoài React (ví dụ lúc chấm bài xong). */
export async function getPremiumStatus() {
  if (devPlus) return { isPremium: true };
  if (!configured) return { isPremium: false };
  try {
    return { isPremium: hasPro(await Purchases.getCustomerInfo()) };
  } catch {
    return { isPremium: false };
  }
}
