# Thanh toán bằng RevenueCat — các bước khi sẵn sàng bán

Hiện app **chưa** cài RevenueCat. Phần khung nằm ở `src/lib/payments.ts` (gói Miễn phí / Gia sư Tiểu học Plus,
hàm kiểm tra quyền `getPremiumStatus`, hàm `purchasePremium`). Tất cả người dùng đang ở gói Miễn phí.

## Cần chuẩn bị (ba mẹ / chủ dự án tự làm)
1. Tài khoản Apple Developer (99 USD/năm) và Google Play Console (25 USD một lần).
2. Tạo sản phẩm đăng ký trên App Store Connect và Google Play (ví dụ gói tháng, gói năm).
3. Tạo tài khoản RevenueCat, thêm app iOS + Android, tạo entitlement tên `premium`
   và một offering chứa các gói trên. Lấy "Public API key" cho iOS và Android.

## Phần code (Claude Code làm khi bạn báo)
1. `npx expo install react-native-purchases react-native-purchases-ui`
2. Thêm key vào `.env.local`: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
   (đây là key công khai, được phép nằm trong app).
3. Trong `src/lib/payments.ts`: gọi `Purchases.configure` với `appUserID` là id người dùng Supabase,
   thay `getPremiumStatus` / `purchasePremium` bằng lệnh thật, thêm màn chọn gói (paywall).
4. Build bản thử bằng `npx eas-cli@latest build --profile development` (Expo Go không chạy được).
5. Muốn máy chủ biết ai đã trả tiền (ví dụ chỉ cho gói Plus chấm bằng Claude): bật webhook RevenueCat
   gửi về một Supabase Edge Function, lưu vào bảng `subscriptions`, và kiểm tra trong hàm `cham-bai`.
