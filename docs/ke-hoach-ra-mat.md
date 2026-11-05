# Kế hoạch: đưa "Gia sư Tiểu học" ra mắt bản đầu

## Trạng thái theo milestone Linear (03/11/2026)

Mỗi giai đoạn dưới đây là một milestone của project "Gia sư Tiểu học — Ra mắt bản đầu" trên Linear (team `GIA`).
Trạng thái chi tiết và việc còn lại xem ở ticket; bảng này chỉ cập nhật khi đồng bộ tài liệu.

| Milestone | Hạn | Đang ở đâu | Ticket chính |
|---|---|---|---|
| 1. Chất lượng chấm bài | 01/11 | Đang làm. Code Gemini đã merge, chờ khoá + deploy + chấm lại 7 bộ mẫu (GIA-19). Đợt 1 xử lý ảnh (GIA-47…52) code xong, chờ duyệt. | GIA-19, GIA-20, GIA-21, GIA-44 |
| 2. Máy chủ & an toàn | 08/11 | Đang làm. Deploy hàm và sửa cổng phụ huynh đang chờ duyệt; còn thử mic trên Android thật. | GIA-22, GIA-23, GIA-24, GIA-35 |
| 3. Thanh toán & build riêng | 22/11 | Chưa bắt đầu (chờ tài khoản Apple Developer, cấu hình RevenueCat). | GIA-25, GIA-26, GIA-27, GIA-28, GIA-29 |
| 4. Beta gia đình | 06/12 | Chưa bắt đầu. Đợt 2 chấm bài (code tính đáp án, GIA-53) có spike, chờ quyết định. | GIA-30, GIA-31, GIA-45 |
| 5. Lên store | 20/12 | Chưa bắt đầu. | GIA-32, GIA-33, GIA-34 |
| Sau ra mắt | — | Backlog. | GIA-36 (nhóm), GIA-46 |

Phần dưới là kế hoạch gốc (18/10/2026), giữ để biết lý do và thứ tự các bước.

## Bối cảnh
App đã có phần lõi: chụp nhiều trang → chấm (Edge Function `cham-bai` gọi Claude, dự phòng LM Studio) → nhận xét + đọc to (`expo-speech`), hồ sơ bé, lịch sử theo môn, đăng nhập Ba Mẹ (Supabase), gói Plus (RevenueCat), EAS đã liên kết. Nhưng **chưa chạy thật**: Supabase đã link (`ssdotdqxdzxphrkxdxux`) mà chưa `db push` / `functions deploy`, RevenueCat chưa cấu hình dashboard, chưa có bản build riêng. Mục tiêu chủ dự án chọn (18/10/2026): **ra mắt bản đầu trước**, tính năng vui (sao, quà…) để sau.

Mỗi giai đoạn làm trên nhánh Git riêng, commit nhỏ; trước mỗi quyết định lớn phải hỏi chủ dự án.

## Giai đoạn 1 — Cho app chạy thật (Supabase + Claude) · milestone 1–2
1. `npx supabase db push` — tạo bảng từ 3 migration trong `supabase/migrations/`.
2. Đặt secret: `npx supabase secrets set ANTHROPIC_API_KEY=...` (lấy từ `.env.local`, không commit).
3. `npx supabase functions deploy cham-bai` (`supabase/functions/cham-bai/index.ts`).
4. Điền `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` vào `.env.local` (theo `.env.example`); bật Google login trong dashboard theo `docs/supabase.md`.
5. Thử: đăng nhập email mã 6 số → tạo hồ sơ bé → chấm 1 bài Toán + 1 bài Tiếng Việt bằng Claude → thấy bài trong lịch sử, đồng bộ lên Supabase (`src/lib/cloud.ts`).
- **Chủ dự án cần làm**: mở dashboard Supabase/Google Cloud khi Claude hướng dẫn (công cụ AI không nhập mật khẩu/key thay).

## Giai đoạn 2 — An toàn và chi phí (bắt buộc trước khi lên store) · milestone 2
> Đã làm trên nhánh `claude/compassionate-engelbart-c80862` (19/10/2026): giới hạn 3 bài/ngày (Miễn phí) và 50 bài/ngày (Plus) qua bảng `grading_usage`; vá RLS; cổng phụ huynh; trang Chính sách quyền riêng tư + nút Xoá tài khoản (hàm `xoa-tai-khoan`).
> Đã gộp vào `ticket/GSTH-004` (20/10/2026), giữ LM Studio bật theo GSTH-003.
> Còn lại: `npx supabase db push`, `npx supabase functions deploy cham-bai xoa-tai-khoan`, đặt secret `REVENUECAT_SECRET_KEY`; đăng chính sách lên một trang web công khai (store bắt buộc có URL) và ghi email hỗ trợ.
- Giới hạn lượt chấm: free vs Plus, kiểm tra ở `cham-bai` (đếm theo user/ngày trong bảng `gradings`), không chỉ ở app.
- Rà RLS các bảng `children`, `gradings`, storage ảnh: mỗi phụ huynh chỉ thấy dữ liệu của mình.
- (Đã thay bằng GSTH-039, 22/10/2026: bỏ LM Studio; chấm bài và Hỏi cô dùng Gemini gói miễn phí để thử, Claude dự phòng; thứ tự đổi bằng secret `AI_THU_TU`.) Quyết định cũ về LM Studio (chốt 19/10/2026, GSTH-003): **tạm bật làm dự phòng cả ở bản phát hành** (chấm bài `src/lib/grading.ts` và Hỏi cô `src/lib/hoi-co.ts`) cho tới khi tài khoản Claude được nạp tiền. Khi đã nạp: tạo ticket chuyển LM Studio về chỉ dùng khi lập trình (`__DEV__`), ẩn ở bản production.
- Xử lý lỗi thân thiện cho bé: mất mạng, ảnh mờ, hết lượt.
- Trang **Chính sách quyền riêng tư** + nút **Xoá tài khoản & dữ liệu** (Apple/Google bắt buộc; app dành cho trẻ em → cần tuân thủ mục Kids/Families).
- Cổng phụ huynh (parental gate) trước màn mua gói Plus và link ra ngoài.

## Giai đoạn 3 — Thanh toán + build riêng · milestone 3
- Cấu hình RevenueCat dashboard + App Store Connect / Play Console theo `docs/thanh-toan-revenuecat.md`.
- `bunx`/`npx eas-cli build --profile development` cho iOS + Android, cài lên máy thật.
- Thử mua gói Plus bằng sandbox, kiểm tra mở khoá Thầy giáo và giới hạn lượt chấm.

## Giai đoạn 4 — Thử nghiệm với vài gia đình · milestone 4
- Bản `preview` qua TestFlight / Internal testing cho 5–10 bé.
- Thu nhận xét: điểm có đúng không, giọng đọc tiếng Việt có ổn trên mọi máy, chữ/nút đủ to.
- Sửa lời dặn chấm bài (`supabase/functions/_shared/cham-bai.ts`) theo bài chấm sai thực tế.
- (Tuỳ chọn) gắn Sentry hoặc log lỗi đơn giản để biết app sập ở đâu.

## Giai đoạn 5 — Lên store · milestone 5
- Icon, splash, ảnh chụp màn hình, mô tả tiếng Việt, phân loại độ tuổi.
- `eas build --profile production` + `eas submit`; cấu hình `eas update` để sửa nhanh sau khi ra mắt.
- Mở PR gộp `setup/khung-du-an` vào `main` trước khi build production.

## Sau ra mắt (từ `docs/viec-con-lai.md`, ticket nhóm GIA-36)
Theo thứ tự đề xuất: sao thưởng + chuỗi ngày → nhiệm vụ hôm nay → màn Chữa bài ("Thử lại câu này", "Hỏi Thầy/Cô") → Tiến độ tuần/tháng → đố vui → cửa hàng quà → môn Tiếng Anh → đăng nhập Apple (bắt buộc nếu iOS có Google login — **nên chuyển lên Giai đoạn 3**) → chế độ tối.

## Kiểm tra mỗi bước
- `npx expo lint` và `npx tsc --noEmit` trước mỗi commit.
- Giai đoạn 1: chấm thật 1 bài, xem log `npx supabase functions logs cham-bai`.
- Giai đoạn 3: mua sandbox thành công trên cả iOS và Android.
- Giai đoạn 5: bản production cài từ TestFlight chạy đủ luồng chụp → chấm → nghe nhận xét.
