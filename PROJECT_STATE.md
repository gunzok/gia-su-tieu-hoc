# PROJECT_STATE: Gia sư Tiểu học
> Đọc file này đầu mỗi phiên (người và agent), cập nhật ở mỗi gate và cuối mỗi sprint.
> Quy trình: hybrid, có gate (ISO/IEC/IEEE 12207). Dự án áp quy trình **khi đã đang chạy** (13/11/2026, GIA-75),
> nên pha 0-4 được ghi nhận hồi tố từ tài liệu có sẵn.

| Mục | Giá trị |
|---|---|
| Slug / Team key | `gia-su-tieu-hoc` / `GIA` |
| Linear | Team [Giasutieuhoc](https://linear.app/justintran/team/GIA) · Project [App mobile (P-GIA-2)](https://linear.app/justintran/project/gia-su-tieu-hoc-app-mobile-iosandroid-401c1c7f181e) · Project [Web app (P-GIA-4)](https://linear.app/justintran/project/gia-su-tieu-hoc-web-app-5c5fa409f986) |
| Repo | [gunzok/gia-su-tieu-hoc](https://github.com/gunzok/gia-su-tieu-hoc) (public, nhánh chính `main`) |
| Web production | https://gia-su-tieu-hoc.giasutieuhoc.workers.dev (chỉ người được mời) |
| Ngày khởi tạo | 2026-10-18 (migration đầu tiên) · áp quy trình: 2026-11-13 |
| Pha hiện tại | **5 Phát triển** (app mobile) · **6 Nghiệm thu** (web: nhóm thử từ 10/11) |

## Gate
| Pha | Trạng thái | Ngày duyệt | Ghi chú |
|---|---|---|---|
| 0 Khởi tạo | Chờ duyệt | | Hồi tố: Linear team + 2 project, repo, CI/CD có gate (GIA-75) |
| 1 Khảo sát | Chờ duyệt (hồi tố) | | Phạm vi trong `docs/ke-hoach-ra-mat.md`, `docs/viec-con-lai.md` |
| 2 BA + stack | Chờ duyệt (hồi tố) | | Stack: [ADR-001](docs/adr/ADR-001-expo-mot-ma-nguon.md), [ADR-002](docs/adr/ADR-002-supabase.md), [ADR-003](docs/adr/ADR-003-ai-cham-bai.md). Chưa có tài liệu use case/NFR riêng |
| 3 Thiết kế | Cần rà soát | | Thiết kế nằm rải rác: `docs/supabase.md`, `docs/webapp.md`, Stitch. Chưa có threat model, chiến lược test viết thành tài liệu |
| 4 WBS | Chờ duyệt (hồi tố) | | Milestone + ticket trên Linear (2 project) |
| 5 Phát triển | Đang làm | | Sprint 1 tuần (Cycles) từ 2026-11-16 |
| 6 Nghiệm thu, bàn giao | Đang làm (web) | | Web: nhóm thử 4 người, GIA-73. App: beta gia đình (milestone 4) |
Trạng thái: Chưa bắt đầu · Đang làm · Chờ duyệt · Đã duyệt · Cần rà soát.

## Quyết định
| Hạng mục | Quyết định | Nguồn |
|---|---|---|
| Tech stack app + web | Expo (SDK 58) + expo-router, một mã nguồn; web dùng hậu tố `.web.tsx` | ADR-001 |
| Máy chủ | Supabase: Auth, Postgres + RLS, Storage, Edge Functions; khoá AI chỉ ở secrets | ADR-002 |
| AI chấm bài, Hỏi cô | Gemini (gói miễn phí, bản thử) chính, Claude dự phòng; web chưa Plus chỉ Gemini | ADR-003 |
| Hosting web | Cloudflare Workers (file tĩnh), deploy bằng `wrangler deploy` | ADR-004 |
| Nhánh, gộp, phát hành | `main` duy nhất; PR + check `CI đạt`; chỉ squash; gộp = phát hành (OTA preview, Supabase, web có cổng duyệt) | ADR-005 |
| Mở web cho người thử | Danh sách mời `moi_dung_thu` + nhận diện web bằng header `Origin` + giới hạn lượt/ngày | ADR-006 |
| Quy ước đặt tên | Nhánh `ticket/GIA-xx` (app, dùng chung), `web/GIA-xx` (web). Tiêu đề PR và commit: `type(GIA-xx): mô tả tiếng Việt` (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`) | ADR-005 |
| Màu, phong cách | `src/constants/theme.ts`; web theo bộ Stitch "Web App … Đa thiết bị" | `docs/webapp.md` |
| Thang ước lượng, độ dài sprint | Điểm Fibonacci 1-2-3-5-8; sprint 1 tuần (Cycles Linear) | GIA-75 |

## Rủi ro
| Mã | Mô tả | Xác suất | Ảnh hưởng | Xử lý | Trạng thái |
|---|---|---|---|---|---|
| R-001 | Điều khoản Gemini API không cho app hướng tới người dưới 18 tuổi; gói miễn phí dùng dữ liệu gửi lên | Cao | Cao | Chỉ dùng cho nhóm thử; chuyển gói trả phí hoặc Claude trước khi mở rộng (GIA-21) | Đang theo dõi |
| R-002 | Chưa bật CAPTCHA đăng ký; đăng nhập ẩn danh vẫn bật (app cần) | Trung bình | Trung bình | Web chặn bằng danh sách mời; CAPTCHA cần sửa code đăng nhập trước | Mở |
| R-003 | OTA kênh `preview` tự gửi khi gộp, không có cổng duyệt | Trung bình | Trung bình | Chỉ máy thử nhận kênh preview; kênh production đi theo tag | Chấp nhận |
| R-004 | Chưa có Sentry DSN và cảnh báo ngân sách AI | Trung bình | Trung bình | Code sẵn; chủ dự án tạo DSN + budget alert (GIA-72) | Mở |
| R-005 | Một người duyệt duy nhất (0 approval bắt buộc) | Trung bình | Cao | CI là cổng chính; thay đổi nhạy cảm (đăng nhập, thanh toán, dữ liệu trẻ em) mời chủ dự án review | Chấp nhận |
| R-006 | Nhiều agent (Claude Code, Codex, Antigravity) cùng một thư mục, đổi nhánh của nhau | Trung bình | Trung bình | Mỗi phiên một worktree riêng; không đổi nhánh ở thư mục chính | Đang theo dõi |

## UI/UX
| Màn hình | Phiên bản | Trạng thái | Ngày |
|---|---|---|---|
| Web: 4 tab (Trang chủ, Quét bài, Chữa bài, Tiến độ) | Stitch đa thiết bị | Đã duyệt (gộp PR #9) | 2026-11-07 |
| Web: Khởi động, Đăng nhập, Hồ sơ bé (nhiều cột) | Stitch | Đang làm (PR #26) | |
| App mobile: các màn chính | `src/constants/theme.ts` | Đang dùng (hồi tố) | |

## Hạn chế đã biết
- Bật Cycles trên Linear chưa có công cụ API: bật tay trong Team settings nếu trình duyệt không làm được.
- Repo public: tài liệu và mã nguồn ai cũng đọc được (đã "bảo lưu mọi quyền" trong `LICENSE`).
- Một số tài liệu cũ còn nhắc nhánh `setup/khung-du-an` (đã ngừng dùng, GIA-59) và mã `GSTH-xxx` (bảng cũ).

## CI còn STUB
Không. `make lint test build security` gọi lệnh thật; CI (`ci.yml`) chạy tsc, lint, Jest, `expo export` (iOS, Android, web), `deno check`, gitleaks, `npm audit`.

## Câu hỏi mở
- Có viết bù tài liệu thiết kế (threat model, chiến lược test) để đóng gate Pha 3 không?
- Bật CAPTCHA khi nào (cần ticket sửa đăng nhập email và ẩn danh trước)?

## Bước tiếp theo
1. Chủ dự án duyệt gate Pha 0-4 (hồi tố) và PR GIA-75.
2. Sprint 1 (16-22/11): GIA-73 thử thật với nhóm thử; GIA-72 Sentry + budget; PR #26 bố cục web.
3. Cuối sprint: demo, velocity, retro, status update Linear.
