# Cấu trúc code: dùng chung / riêng mobile / riêng web

Rà soát ở GIA-58 (18/11/2026). App iOS/Android và bản web là **một mã nguồn Expo** (ADR-001):
chung phần chức năng, giao diện làm riêng. Quy ước ngắn nằm ở `AGENTS.md`, mục "Tách Mobile / Web".

## Ba lớp

| Lớp | Thư mục | Ai dùng | Được import |
|---|---|---|---|
| **Lõi dùng chung** | `src/lib/`, `src/hooks/`, `src/constants/`, `supabase/` | App + web | Thư viện, `@/lib`, `@/hooks`, `@/constants`. **Không** `@/app`, `@/components`, `@/web` (ESLint chặn) |
| **Giao diện mobile** | `src/app/**/*.tsx` (không hậu tố `.web`), `src/components/` | App (web dùng lại một số khối nhỏ, xem dưới) | Mọi lớp trừ `@/web` |
| **Giao diện web** | `src/app/**/*.web.tsx`, `src/web/` | Web | Mọi lớp |

Luật ESLint `no-restricted-imports` trong `eslint.config.js` báo lỗi khi file trong `src/lib`, `src/hooks`,
`src/constants` import từ `@/app`, `@/components`, `@/web` (cả đường dẫn tương đối `../app/…`).

Khác biệt nền tảng trong lõi: dùng **hậu tố `.web.ts(x)`** khi hai bản khác nhau cả file (thư viện native không
chạy trên web, ví dụ `page-images`, `session-storage`); dùng **`Platform.OS` một dòng** khi chỉ khác một giá trị
hay một nhánh nhỏ. Không tách file chỉ để bỏ một dòng `Platform.OS`: hai bản sẽ phải sửa song song, dễ lệch.

## Lõi dùng chung: từng file

| File | Loại | Ghi chú |
|---|---|---|
| `src/lib/auth.tsx` | Dùng chung | `Platform.OS` ở đăng nhập Google (xem bảng dưới) |
| `src/lib/cloud.ts`, `history.ts`, `progress.ts`, `rewards.ts`, `teacher.ts`, `greetings.ts`, `item-speech.ts`, `email-code.ts`, `oauth-redirect.ts`, `photo-quality.ts`, `retry-check.ts`, `level-check.ts` | Dùng chung | Logic thuần, không phụ thuộc nền tảng |
| `src/lib/grading.ts`, `prepare-photo.ts` | Dùng chung | Chấm bài, chuẩn bị ảnh (`expo-image-manipulator` có bản web) |
| `src/lib/hoi-co.ts` | Dùng chung | `Platform.OS` tắt LM Studio trên web; dùng `router` (xem dưới) |
| `src/lib/homework-session.tsx` | Dùng chung | `Platform.OS` ở chọn ảnh; dùng `router` |
| `src/lib/payments.tsx` | Dùng chung | RevenueCat (`react-native-purchases` có bản web); dùng `router` |
| `src/lib/profile.tsx`, `use-profile-form.ts`, `use-parent-login.ts` | Dùng chung | Hook form/đăng nhập; hai file sau dùng `router` |
| `src/lib/speech.ts` | Dùng chung | `Platform.OS` chỉnh tốc độ đọc iOS/Android |
| `src/lib/nghe-giong.ts`, `read-page-text.ts` | Dùng chung | Gọi mã native tuỳ chọn (`requireOptionalNativeModule`); web không có thì trả rỗng/ẩn nút |
| `src/lib/supabase.ts` | Dùng chung | `Platform.OS` cho `detectSessionInUrl` |
| `src/lib/web-alert.ts` | Dùng chung | Hàng đợi hộp thoại; chỉ thay `Alert.alert` khi chạy web |
| `src/lib/document-scanner.ts` / `.web.ts` | Có bản riêng mỗi nền tảng | Web không có máy quét tài liệu |
| `src/lib/page-images.ts` / `.web.ts` | Có bản riêng mỗi nền tảng | Mobile dùng `expo-file-system`, web dùng Blob/URL |
| `src/lib/session-storage.ts` / `.web.ts` | Có bản riêng mỗi nền tảng | Mobile: `expo-sqlite/localStorage`; web: `window.localStorage` |
| `src/lib/monitoring.ts` / `.web.ts` | Có bản riêng mỗi nền tảng | Báo lỗi chỉ bật trên web |
| `src/hooks/use-theme.ts` | Dùng chung | |
| `src/hooks/use-color-scheme.ts` / `.web.ts` | Có bản riêng mỗi nền tảng | Web chờ hydrate xong mới đọc chế độ màu |
| `src/hooks/use-nghe-giong.ts` | Dùng chung | `Platform.OS` khi trả âm thanh iPhone về chế độ phát |
| `src/constants/theme.ts` | Dùng chung | `Platform.select` cho font, khoảng chừa thanh tab; import `@/global.css` (biến font cho web) |

## `Platform.OS` trong lõi: giữ hay tách

| Chỗ | Làm gì | Quyết định | Lý do |
|---|---|---|---|
| `auth.tsx` `signInWithGoogle` | Web chuyển hẳn trang sang Google; app mở phiên trình duyệt | Giữ | Một nhánh trong một hàm; tách `.web` phải chép cả `AuthProvider` (~140 dòng) |
| `speech.ts` `rate` | Tốc độ đọc iOS 0.96, còn lại 0.95 | Giữ | Một giá trị, không phải khác biệt web |
| `homework-session.tsx` `pickPhoto` | Web bấm "chụp" thì mở hộp chọn ảnh | Giữ | Một dòng; file là hook chung lớn |
| `grading.ts`, `hoi-co.ts` `lmStudioUrl` | Web không gọi LM Studio trong mạng nhà | Giữ | Một dòng; không sửa logic chấm bài |
| `supabase.ts` `detectSessionInUrl` | Web đọc phiên từ địa chỉ sau Google | Giữ | Một giá trị cấu hình |
| `web-alert.ts` | Thay `Alert.alert` trên web | Giữ | Hàng đợi dùng ở `src/web/web-alert-host.tsx`, `_layout.tsx` import cho cả hai bản; tách cần thêm bản rỗng cùng API, lợi ít |
| `use-nghe-giong.ts` `restorePlayback` | Chỉ iPhone đổi phiên âm thanh | Giữ | Khác biệt iOS/Android, không phải web |
| `theme.ts` `Fonts`, `BottomTabInset` | Font, khoảng chừa theo nền tảng | Giữ | `Platform.select` là cách chuẩn cho hằng số giao diện |

Ngoài lõi: `src/app/hoi-co.tsx` dùng `Platform.OS === 'ios'` cho `KeyboardAvoidingView` (giao diện mobile, để nguyên).

## `router` của expo-router trong lõi (ngoại lệ có ghi nhận)

5 file trong `src/lib/` gọi `router` để chuyển màn sau một việc: `hoi-co.ts` (mở `/hoi-co`), `payments.tsx` và
`homework-session.tsx` (mở `/goi-plus`), `use-profile-form.ts` (`/`), `use-parent-login.ts` (`/ho-so`, `/`).

Giữ nguyên ở GIA-58 vì: expo-router không phải file giao diện của dự án, các đường dẫn trên có ở cả hai bản
(Expo Router chọn `*.web.tsx` hay `*.tsx` theo nền tảng), và đổi chữ ký hook sẽ phải sửa màn hình web và mobile
(ngoài phạm vi ticket refactor). Nếu sau này web cần đường dẫn khác, chuyển các lệnh chuyển màn thành tham số
callback (`onDone`, `onNeedPlus`) do màn hình truyền vào.

## Giao diện mobile mà web dùng lại

Web import một số khối nhỏ từ `src/components/`: `app-text`, `big-button`, `card`, `mascot`, `choice-chips`,
`sound-wave`, `account-card`, `ask-teacher-button`, `grading-overlay`, `item-speak-button`, `privacy-card`,
`retry-question`. Khi sửa các file này phải thử cả hai bản. Các khối khác trong `src/components/` chỉ mobile dùng.
