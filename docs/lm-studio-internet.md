# Chấm bài bằng LM Studio trên máy Mac ở nhà, dùng qua internet (GIA-80)

> **Chưa làm gì ở đây cho tới khi chủ dự án duyệt [ADR-008](adr/ADR-008-lm-studio-qua-internet.md).**
> Tài liệu này là các bước để chủ dự án tự làm sau khi duyệt. Không dán khoá hay token vào chat, Linear hay GitHub.
> Thông tin dịch vụ tra ngày 14/11/2026, nguồn ghi ở cuối ADR-008.

## Tóm tắt trong 30 giây

- Bài LM Studio mất 4-8 phút. Hàm Supabase bị cắt sau 150 giây (gói Free), còn Cloudflare cắt sau 125 giây. Vì vậy
  máy chủ **không thể chờ** LM Studio chấm xong qua đường hầm.
- Cách đề xuất (phương án A): **máy Mac tự hỏi máy chủ "có bài nào không?"**, chấm ở nhà rồi gửi kết quả lên.
  Máy Mac không mở cổng nào, không có địa chỉ công khai.
- Cần viết code trước (khoảng 3 ticket, mục "Việc cần làm"). Phần 1 dưới đây chủ dự án làm được ngay khi duyệt,
  không cần chờ code.

## Việc cần làm sau khi duyệt (thứ tự)

| Bước | Ai làm | Nội dung |
|---|---|---|
| 0 | Chủ dự án | Duyệt ADR-008 (đổi trạng thái thành "Đã chấp nhận") |
| 1 | Chủ dự án | Phần 1: chuẩn bị máy Mac + đo model 27B trên bộ mẫu (dưới 18/21 lỗi thì dừng ở đây) |
| 2 | Worker (ticket mới, `Dùng chung`) | Hàng đợi `viec_cham_lm` (RLS) + 2 hàm Edge `lay-viec-lm`, `tra-ket-qua-lm` + `cham-bai` thêm bước `lmstudio` |
| 3 | Worker (ticket mới) | Chương trình chạy trên máy Mac (`scripts/may-cham-nha/`) + file launchd mẫu |
| 4 | Worker (ticket mới, `Mobile`) | App chờ kết quả (Realtime), sửa Chính sách riêng tư, bỏ `EXPO_PUBLIC_LMSTUDIO_URL` |
| 5 | Chủ dự án | Phần 2: đặt secret, cài chương trình trên máy Mac, bật `AI_THU_TU` |
| 6 | Chủ dự án + QA | Phần 3: thử và theo dõi 1 tuần |

## Phần 1: chuẩn bị máy Mac (làm được ngay khi duyệt)

1. **Cập nhật LM Studio** lên bản 0.4.0 trở lên (menu LM Studio → Check for Updates).
2. **Bật mã truy cập cho LM Studio:** mở tab **Developer** → **Server Settings** → bật
   **Require Authentication for each request** → **Manage Tokens** → tạo token tên `may-cham-nha`.
   Token chỉ hiện một lần: lưu vào **Keychain Access** (tên mục `lmstudio-token`), không lưu vào file thường.
3. **Chỉ cho máy này gọi LM Studio:** trong Server Settings, **tắt** "Serve on Local Network" (tên mục có thể khác tuỳ phiên bản). Server chỉ nghe
   `127.0.0.1:1234`. (Lưu ý: app hiện vẫn gọi LM Studio qua Wi-Fi nhà. Tắt mục này thì đường cũ ngừng chạy,
   nên chỉ tắt khi chương trình mới ở bước 3 đã sẵn sàng. Trong lúc chờ, cứ để như cũ và chỉ bật token.)
4. **Tải model và giữ trong bộ nhớ:** tải `qwen/qwen3.8-27b` (hoặc model chủ dự án chọn), bật "Keep model in memory".
5. **Không lưu nội dung bài:** trong tab Developer, tắt việc ghi log nội dung yêu cầu (nếu có tuỳ chọn), và không mở
   lịch sử chat cho các bài chấm.
6. **Bảo vệ máy:** System Settings → Privacy & Security → **FileVault: On**; Lock Screen → yêu cầu mật khẩu ngay
   khi màn hình tắt; bật cập nhật macOS tự động.
7. **Không cho máy ngủ khi cắm điện:** System Settings → Energy (hoặc Battery → Options) → bật
   **Prevent automatic sleeping when the display is off** và **Start up automatically after a power failure**
   (nếu có). Màn hình vẫn tắt bình thường.
8. **Đo chất lượng model 27B** trên bộ mẫu 10 ảnh (`mau-bai-tap/`, không đưa lên GitHub) như đã làm ở GIA-54/55.
   Ghi số lỗi tìm đúng trên 21 và số phút/bài vào comment GIA-80. **Dưới 18/21 hoặc trên 10 phút/bài thì dừng.**
9. (Tuỳ chọn) Cắm máy qua ổ cắm đo điện 1 tuần để biết tiền điện thật.

## Phần 2: bật chấm bài qua máy ở nhà (sau khi các ticket code đã gộp)

1. Tạo mã cho máy Mac (chạy trong Terminal, **không** dán kết quả vào đâu khác):

   ```bash
   openssl rand -hex 32
   ```

2. Đặt mã đó vào Supabase (tự gõ, thay `MA_VUA_TAO`):

   ```bash
   npx supabase secrets set MAY_NHA_TOKEN=MA_VUA_TAO
   ```

   Lưu thêm một bản vào Keychain Access (tên mục `may-nha-token`) để chương trình trên máy Mac đọc.
3. Cài chương trình chạy nền theo README trong `scripts/may-cham-nha/` (sẽ có ở ticket bước 3): chương trình đọc
   2 mã từ Keychain, launchd tự chạy lại khi máy khởi động.
4. Bật bước LM Studio ở cuối chuỗi dự phòng:

   ```bash
   npx supabase secrets set AI_THU_TU=gemini,claude,lmstudio
   ```

## Phần 3: thử và theo dõi

1. Máy Mac bật, chương trình đang chạy: chọn lúc nhóm thử không dùng app, tạm đặt `AI_THU_TU=lmstudio`, chấm 1 ảnh
   mẫu từ app qua mạng 4G (không dùng Wi-Fi nhà), rồi đặt lại `AI_THU_TU=gemini,claude,lmstudio` ngay. Kết quả phải về trong khoảng 10 phút, có dòng "chấm bằng AI trên máy ở nhà".
2. Tắt chương trình (hoặc cho máy ngủ), chấm lại: trong khoảng 2 phút máy chủ phải báo bận, **lượt chấm còn nguyên**.
3. Rút mạng máy Mac giữa lúc đang chấm: sau 15 phút bài phải báo lỗi và trả lại lượt.
4. Sau 1 tuần: xem số bài được chấm ở nhà, thời gian trung bình, lỗi; ghi vào Linear.

## Tắt khẩn cấp và gỡ

- Tắt ngay (không cần code): `npx supabase secrets set AI_THU_TU=gemini,claude`. Máy chủ ngừng đưa bài vào hàng đợi.
- Lộ mã máy Mac: tạo mã mới (Phần 2, bước 1-2); mã cũ hết hiệu lực ngay khi secret đổi.
- Lộ token LM Studio: Manage Tokens → xoá token cũ, tạo token mới, cập nhật Keychain.
- Gỡ hẳn: tắt launchd theo README, xoá 2 mục Keychain, xoá secret `MAY_NHA_TOKEN`.

## Phụ lục: phương án dự bị B (Cloudflare Tunnel + Access), chỉ khi được chọn riêng

Chỉ dùng cho việc ngắn chạy xong dưới 2 phút (vd Hỏi cô), **không** dùng cho chấm bài (giới hạn 125 giây của
Cloudflare và 150/400 giây của Supabase). Cần một tên miền đã thêm vào Cloudflare (gọi là `ten-mien.vn` ở dưới).

1. Cloudflare Zero Trust → **Networks → Tunnels → Create a tunnel** → loại **Cloudflared**, tên `lmstudio-nha`.
2. Chọn macOS, làm theo lệnh cài hiện trên màn hình (`brew install cloudflared`, rồi `sudo cloudflared service install <token>`;
   token hiện trên màn hình Cloudflare, không chép ra chỗ khác).
3. **Public Hostname:** `lm.ten-mien.vn` → Service `http://localhost:1234`.
4. **Access → Service Auth → Service Tokens → Create**, tên `supabase-lmstudio`, thời hạn 1 năm. Chép
   Client ID và Client Secret (Secret chỉ hiện một lần).
5. **Access → Applications → Add → Self-hosted**, domain `lm.ten-mien.vn`. Thêm policy action **Service Auth**,
   Include → Service Token → `supabase-lmstudio`. Không thêm policy nào khác.
6. Đặt secret (tự gõ):

   ```bash
   npx supabase secrets set LMSTUDIO_URL=https://lm.ten-mien.vn \
     CF_ACCESS_CLIENT_ID=... CF_ACCESS_CLIENT_SECRET=... LMSTUDIO_API_TOKEN=...
   ```

7. Kiểm tra từ máy khác: gọi `https://lm.ten-mien.vn/v1/models` **không** kèm header phải bị chặn (403 hoặc trang
   đăng nhập Cloudflare); kèm đủ header `CF-Access-Client-Id`, `CF-Access-Client-Secret` và
   `Authorization: Bearer <token LM Studio>` thì mới ra danh sách model.
8. Cloudflare gửi email cảnh báo một tuần trước khi service token hết hạn: gia hạn (Refresh) rồi cập nhật secret.
