# Thanh toán bằng RevenueCat — gói "Gia sư Tiểu học Plus"

## Đã có trong app
- SDK: `react-native-purchases` + `react-native-purchases-ui` (bản 10.14).
- Code ở `src/lib/payments.tsx`:
  - `PremiumProvider`: khởi tạo RevenueCat một lần, theo dõi thay đổi gói (`addCustomerInfoUpdateListener`),
    gắn giao dịch với tài khoản Supabase của ba mẹ (`Purchases.logIn`), đăng xuất thì về ẩn danh.
  - `usePremium()`: `isPremium`, `showPaywall()` (Paywall của RevenueCat, chỉ hiện khi chưa có Plus),
    `showCustomerCenter()` (đổi/huỷ gói, hoàn tiền, khôi phục), `restore()`, `getOfferings()`.
  - Quyền Plus = entitlement **`gia_sư_tiểu_học_pro`** đang hoạt động.
- Nơi dùng: thẻ gói Plus ở tab **Tiến độ**; thẻ **Thầy giáo** đang khoá ở màn Hồ sơ mở Paywall.
- API key nằm trong `.env.local`: `EXPO_PUBLIC_REVENUECAT_API_KEY` (key Test Store `test_…`).
  Đây là key công khai của SDK, được phép nằm trong app (khác Claude key).

## Cấu hình trên RevenueCat dashboard (ba mẹ / chủ dự án tự làm)
1. **Product catalog → Products** (chọn store "Test Store"): tạo 3 sản phẩm
   - `monthly` — gói tháng (subscription, 1 tháng)
   - `yearly` — gói năm (subscription, 1 năm)
   - `lifetime` — mua một lần dùng mãi (non-consumable / one-time)
2. **Product catalog → Entitlements**: tạo entitlement có identifier **đúng** là `gia_sư_tiểu_học_pro`,
   rồi gắn cả 3 sản phẩm vào. Nếu RevenueCat không nhận chữ có dấu, đặt `gia_su_tieu_hoc_pro`
   và đổi hằng `PRO_ENTITLEMENT` trong `src/lib/payments.tsx` cho khớp.
3. **Product catalog → Offerings**: tạo offering `default` (đánh dấu **Current**), thêm 3 package:
   `$rc_monthly` → monthly, `$rc_annual` → yearly, `$rc_lifetime` → lifetime.
4. **Paywalls**: tạo paywall cho offering `default` (chọn mẫu, sửa chữ sang tiếng Việt). App gọi
   `presentPaywallIfNeeded` nên hiện đúng paywall của offering Current.
5. **Customer Center**: bật trong mục Customer Center (dùng cho nút "Quản lý gói").

## Thử nghiệm
- **Expo Go**: SDK tự chạy chế độ xem thử (Preview API Mode) — không mua thật, gói Plus không mở.
  Muốn xem giao diện Plus trong Expo Go: đặt `EXPO_PUBLIC_DEV_PLUS=1` trong `.env.local` rồi khởi động lại Expo.
- **Mua thử thật (Test Store)**: cần bản build riêng:
  ```
  npx expo install expo-dev-client
  npx eas-cli@latest build --profile development --platform android
  ```
  Test Store không cần tài khoản App Store / Google Play. Gói tháng thử tự gia hạn nhanh (~5 phút/tháng, tối đa 5 lần).

## Trước khi phát hành
- Key Test Store làm **sập** bản release (cố ý). Phải thay bằng key iOS (`appl_…`) và Android (`goog_…`),
  tách theo `Platform.OS` trong `configurePurchases()`.
- Tạo sản phẩm thật trên App Store Connect / Google Play Console (cần tài khoản Apple Developer 99 USD/năm,
  Google Play 25 USD), cùng mã `monthly`, `yearly`, `lifetime`, rồi gắn vào entitlement/offering như trên.
- Nếu muốn máy chủ biết ai trả tiền (ví dụ chỉ gói Plus mới chấm bằng Claude): bật webhook RevenueCat
  gửi về một Supabase Edge Function, lưu bảng `subscriptions`, kiểm tra trong hàm `cham-bai`.
