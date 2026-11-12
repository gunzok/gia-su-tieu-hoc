---
name: eas-release
description: Phát hành app Gia sư Tiểu học - đổi version, build EAS (Android preview, iOS máy giả lập), gửi cập nhật OTA, deploy migration và Edge Function Supabase. Dùng khi DevOps cần đưa thay đổi lên điện thoại hoặc máy chủ.
argument-hint: "<việc cần phát hành: update | build | deploy <hàm> | version <x.y.z>>"
---

# /eas-release

Quy trình phát hành riêng của dự án (chỉ làm local, KHÔNG push GitHub). Đọc trước:
`scripts/ban-build.js`, `eas.json`, `app.json`, `docs/supabase.md`, `docs/giong-doc-google.md`.

## 1. Chọn đúng cách đưa lên điện thoại

| Thay đổi | Cách làm | Lệnh |
|---|---|---|
| Chỉ mã JS/TS, ảnh, chữ | Cập nhật OTA, không build lại | `npm run update:preview` |
| Thêm/bỏ thư viện có mã gốc (vd `expo-audio`), đổi plugin, quyền, `app.json` phần native | Nâng version rồi build lại | `npm run version:set -- x.y.z` rồi build |
| Android bản cài thử | Build EAS | `npm run build:preview` |
| iOS (chưa có Apple Developer) | Build cho máy giả lập | `npm run build:ios-sim` rồi `npx eas-cli@latest build:run --platform ios --latest` |

- `runtimeVersion` theo version app: bản cài 0.2.0 chỉ nhận cập nhật của 0.2.0. Đổi version thì phải build và cài lại.
- Khi build xong, câu hỏi "Install and run on an emulator?" chọn **no** (máy không có Android Studio).
- Biến `EXPO_PUBLIC_*` cho EAS: `npm run env:eas`. KHÔNG bao giờ đưa `ANTHROPIC_API_KEY`, khoá Google, khoá service role lên EAS hay vào code.

- **Connector/plugin Expo** (chủ dự án thêm 20/10/2026): mỗi lần có bản build hoặc cập nhật OTA mới, dùng công cụ Expo đó (tìm bằng ToolSearch từ khoá `expo`) để xem build/update, lấy link cài, kiểm tra trạng thái. Chỉ quay về `npx eas-cli@latest` khi phiên không có công cụ Expo, và nói rõ điều đó.
- **Expo Go không chạy được app từ 0.3.0** (có `expo-speech-recognition`, `expo-audio`, `expo-updates`). Mục "Branch: preview" trong Expo Go là bản OTA cũ, đừng hướng dẫn chủ dự án mở app qua Expo Go; đưa link APK preview để cài.

## 2. Máy chủ Supabase

- Migration: `npx supabase db push` (đọc tên migration sắp đẩy, chọn Yes).
- Hàm: `npx supabase functions deploy <ten-ham>` (`cham-bai`, `hoi-co`, `doc-loi`, `xoa-tai-khoan`).
- Khoá bí mật: `npx supabase secrets set TEN=...` - chủ dự án tự gõ, Claude không nhập khoá thay.
- **Cảnh báo `cham-bai`**: nhánh Giai đoạn 2 có giới hạn lượt chấm trong `cham-bai/index.ts`. Chỉ deploy `cham-bai` từ nhánh đã gộp Giai đoạn 2 (ticket GSTH-004/005), nếu không sẽ xoá mất giới hạn lượt.

## 3. Kiểm tra trước khi phát hành (bắt buộc)

1. `npx tsc --noEmit` và `npx expo lint` sạch (trừ lỗi cũ đã có ticket).
2. Đã commit; ghi commit vào comment của ticket trên Linear.
3. Hàm vừa deploy: gọi thử bằng phiên ẩn danh tạm (`/auth/v1/signup` với publishable key), không in khoá ra màn hình.
4. Cập nhật OTA xong: mở lại app 2 lần trên máy giả lập (`xcrun simctl terminate/launch booted vn.giasutieuhoc.app`) và kiểm tra tính năng mới.

## 4. Phát hành một version mới (đổi x.y.z)

Làm theo thứ tự, mỗi bước xong mới sang bước sau:

1. Code đã merge vào `main`, GitHub Actions "Kiểm tra" xanh (lint + tsc + test).
2. `npm run version:set -- x.y.z` (đổi cả `app.json` và `package.json`).
3. `CHANGELOG.md`: đổi mục "Chưa phát hành" thành `## [x.y.z] - YYYY-MM-DD`, viết cho ba mẹ đọc
   (thấy gì khác, không ghi chi tiết kỹ thuật), giữ mã ticket. Thêm mục "Chưa phát hành" trống ở trên.
   Có thể dùng skill `changelog-generator` để gom commit từ tag trước: `git log vA.B.C..HEAD --no-merges`.
4. Commit "Version x.y.z", rồi tag có ghi chú: `git tag -a vx.y.z -m "x.y.z: <tóm tắt>"`.
5. Build/OTA theo mục 1. Bản OTA không đổi version thì vẫn ghi vào "Chưa phát hành" và ghi Update group ID vào tag
   hoặc ticket.
6. Đưa `main` lên bản phát hành chỉ qua PR (GIA-34), khi chủ dự án đồng ý; không tự push tag hay `main`.

## 5. Sau khi phát hành

- Ghi vào ticket: lệnh đã chạy, Update group ID / build ID, kết quả kiểm tra.
- Nhắc chủ dự án: tắt hẳn app rồi mở lại 1-2 lần trên điện thoại để nhận bản mới.
