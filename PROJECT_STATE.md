# PROJECT_STATE: Gia sư Tiểu học
> Đọc file này đầu mỗi phiên (người và agent), cập nhật ở mỗi gate và cuối mỗi sprint.
> Quy trình: hybrid, có gate (ISO/IEC/IEEE 12207). Dự án áp quy trình **khi đã đang chạy** (13/11/2026, GIA-75),
> nên pha 0-4 được ghi nhận hồi tố từ tài liệu có sẵn.

| Mục | Giá trị |
|---|---|
| Slug / Team key | `gia-su-tieu-hoc` / `GIA` |
| Linear | Team [Giasutieuhoc](https://linear.app/justintran/team/GIA) · Project [App mobile (P-GIA-2)](https://linear.app/justintran/project/gia-su-tieu-hoc-app-mobile-iosandroid-401c1c7f181e) · Project [Web app (P-GIA-4)](https://linear.app/justintran/project/gia-su-tieu-hoc-web-app-5c5fa409f986) |
| Repo | [gunzok/gia-su-tieu-hoc](https://github.com/gunzok/gia-su-tieu-hoc) (public, nhánh chính `main`) |
| Web production | https://gia-su-tieu-hoc.giasutieuhoc.workers.dev (mở công khai từ 14/11, GIA-78; máy chủ còn danh sách mời tới khi tắt `WEB_CHI_NGUOI_DUOC_MOI`) |
| App Android | 0.5.0 APK cài trực tiếp: https://github.com/gunzok/gia-su-tieu-hoc/releases/latest (trang web `/tai-app`), phát hành 15/11 (GIA-79) |
| Ngày khởi tạo | 2026-10-18 (migration đầu tiên) · áp quy trình: 2026-11-13 |
| Pha hiện tại | **6 Nghiệm thu, vận hành** (web công khai + app Android APK 0.5.0 từ 15/11) · **5 Phát triển** cho việc sau ra mắt |

## Gate
| Pha | Trạng thái | Ngày duyệt | Ghi chú |
|---|---|---|---|
| 0 Khởi tạo | Đã duyệt (hồi tố) | 2026-11-13 | Hồi tố: Linear team + 2 project, repo, CI/CD có gate (GIA-75) |
| 1 Khảo sát | Đã duyệt (hồi tố) | 2026-11-13 | Phạm vi trong `docs/ke-hoach-ra-mat.md`, `docs/viec-con-lai.md` |
| 2 BA + stack | Đã duyệt (hồi tố) | 2026-11-13 | Stack: [ADR-001](docs/adr/ADR-001-expo-mot-ma-nguon.md), [ADR-002](docs/adr/ADR-002-supabase.md), [ADR-003](docs/adr/ADR-003-ai-cham-bai.md). Chưa có tài liệu use case/NFR riêng |
| 3 Thiết kế | Cần rà soát | | Thiết kế nằm rải rác: `docs/supabase.md`, `docs/webapp.md`, Stitch. Chưa có threat model, chiến lược test viết thành tài liệu |
| 4 WBS | Đã duyệt (hồi tố) | 2026-11-13 | Milestone + ticket trên Linear (2 project) |
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
| Phân vai | Code luôn chạy trên Orca (agent `claude`, model Opus 5.5, mỗi ticket một worktree); phiên Claude Code desktop chỉ điều phối | `CLAUDE.md` (13/11) |
| Thang ước lượng, độ dài sprint | Điểm Fibonacci 1-2-3-5-8; sprint 1 tuần (Cycles Linear) | GIA-75 |

## Rủi ro
| Mã | Mô tả | Xác suất | Ảnh hưởng | Xử lý | Trạng thái |
|---|---|---|---|---|---|
| R-001 | Điều khoản Gemini API không cho app hướng tới người dưới 18 tuổi; gói miễn phí dùng dữ liệu gửi lên | Cao | Cao | Chủ dự án chấp nhận 14/11: miễn phí dùng Gemini miễn phí, Plus dùng Gemini trả phí (GIA-77); chính sách ghi rõ. Cần rà pháp lý | Chấp nhận có điều kiện |
| R-002 | Chưa bật CAPTCHA đăng ký; đăng nhập ẩn danh vẫn bật (app cần) | Trung bình | Trung bình | ADR-007: giữ CAPTCHA tắt, dựa vào rate limit Auth + giới hạn lượt + cầu dao tổng cho mọi yêu cầu (GIA-84); Turnstile khi có bản app mới | Đang theo dõi |
| R-003 | OTA kênh `preview` tự gửi khi gộp, không có cổng duyệt | Trung bình | Trung bình | Chỉ máy thử nhận kênh preview; kênh production đi theo tag | Chấp nhận |
| R-004 | Chưa có Sentry DSN và cảnh báo ngân sách AI | Trung bình | Trung bình | Code sẵn; chủ dự án tạo DSN + budget alert (GIA-72) | Mở |
| R-005 | Một người duyệt duy nhất (0 approval bắt buộc) | Trung bình | Cao | CI là cổng chính; thay đổi nhạy cảm (đăng nhập, thanh toán, dữ liệu trẻ em) mời chủ dự án review | Chấp nhận |
| R-007 | Gemini gói miễn phí chỉ 5 lượt/phút và hay quá tải (503) | Cao | Cao | Plus dùng khoá Gemini trả phí khi chủ dự án đặt `GEMINI_API_KEY_TRA_PHI` (GIA-77); miễn phí báo bận thân thiện, cầu dao tổng (GIA-84); LM Studio qua hàng đợi (ADR-008, đề xuất) | Mở |
| R-008 | Tích hợp GitHub của Supabase tự deploy migration + hàm lên production ~40 giây sau khi gộp vào `main`, đi vòng qua cổng duyệt `Production` của `CD - Supabase` (phát hiện 15/11) | Cao | Cao | Chủ dự án tắt deploy tự động của tích hợp (Dashboard → Project Settings → Integrations → GitHub) hoặc bỏ `cd-supabase.yml`; tới lúc đó coi gộp PR đổi `supabase/` = deploy thật | Mở |
| R-006 | Nhiều agent (Claude Code, Codex, Antigravity) cùng một thư mục, đổi nhánh của nhau | Trung bình | Trung bình | Mỗi phiên một worktree riêng; không đổi nhánh ở thư mục chính | Đang theo dõi |

## UI/UX
| Màn hình | Phiên bản | Trạng thái | Ngày |
|---|---|---|---|
| Web: 4 tab (Trang chủ, Quét bài, Chữa bài, Tiến độ) | Stitch đa thiết bị | Đã duyệt (gộp PR #9) | 2026-11-07 |
| Web: Khởi động, Đăng nhập, Hồ sơ bé (nhiều cột) | Stitch | Đang làm (PR #26) | |
| App mobile: các màn chính | `src/constants/theme.ts` | Đang dùng (hồi tố) | |

## Hạn chế đã biết
- Linear tự chuyển ticket sang Done khi gộp PR có `GIA-xx` trong tiêu đề: ticket còn việc dở phải đưa về trạng thái cũ.
- Repo public: tài liệu và mã nguồn ai cũng đọc được (đã "bảo lưu mọi quyền" trong `LICENSE`).
- Một số tài liệu cũ còn nhắc nhánh `setup/khung-du-an` (đã ngừng dùng, GIA-59) và mã `GSTH-xxx` (bảng cũ).

## CI còn STUB
Không. `make lint test build security` gọi lệnh thật; CI (`ci.yml`) chạy tsc, lint, Jest, `expo export` (iOS, Android, web), `deno check`, gitleaks, `npm audit`.

## Câu hỏi mở
- Có viết bù tài liệu thiết kế (threat model, chiến lược test) để đóng gate Pha 3 không?
- Duyệt ADR-007 (mở web, CAPTCHA tắt), ADR-008 (LM Studio qua hàng đợi, cần đo model 27B trước), ADR-009 (chưa làm đăng nhập bằng tài khoản AI cá nhân)?

## Bước tiếp theo
1. Chủ dự án: tắt `WEB_CHI_NGUOI_DUOC_MOI` (mở web thật sự), đặt `GEMINI_API_KEY_TRA_PHI`, tắt deploy tự động của tích hợp GitHub Supabase (R-008), budget alert Google Cloud + Anthropic, thử cài APK 0.5.0 trên máy Android thật.
2. Sprint 1 (16-22/11): xác nhận nội dung Cycle đầu sprint (GIA-73 thử thật, GIA-72 Sentry, GIA-58, quyết định ADR-008/009).
3. Cuối sprint: demo, velocity, retro, status update Linear.
