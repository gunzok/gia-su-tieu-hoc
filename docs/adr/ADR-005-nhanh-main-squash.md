# ADR-005: `main` duy nhất, PR + CI, squash merge, Conventional Commits

- **Trạng thái**: Đã chấp nhận
- **Ngày**: 2026-11-12 (GIA-59: `main` duy nhất) · 2026-11-13 (GIA-75: squash, Conventional Commits, cổng web)
- **Người quyết định**: chủ dự án

## Bối cảnh
Trước đây có `setup/khung-du-an` làm nhánh trung gian, PR gộp bằng merge commit, lịch sử `main` khó đọc. Nhiều agent
(Claude Code, Codex, Antigravity) cùng làm.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| `main` + PR, chỉ squash, Conventional Commits | Mỗi PR một commit, dễ đọc, dễ revert, Linear tự nhận mã ticket | Mất lịch sử commit nhỏ trong nhánh (vẫn còn trong PR) |
| Giữ merge commit | Giữ nguyên lịch sử | `main` rối, khó tạo changelog |
| Nhánh `develop` + `main` | Tách bản thử / bản thật | Thêm bước, dễ lệch nhánh |

## Quyết định
- Mọi thay đổi vào `main` qua PR; ruleset `bao-ve-main`: bắt buộc check `CI đạt` (cập nhật theo `main`), cấm force push và xoá
  nhánh, bắt giải quyết hết comment, **chỉ squash**; tự xoá nhánh sau khi gộp.
- Nhánh: `ticket/GIA-xx-ten-ngan` (app, dùng chung), `web/GIA-xx-ten-ngan` (web).
- Tiêu đề PR (= commit trên `main`): `type(GIA-xx): mô tả tiếng Việt`, `type` ∈ `feat, fix, docs, chore, refactor, test, ci, perf`.
- Gộp vào `main` là phát hành: OTA kênh `preview` tự gửi; Supabase và web chờ duyệt environment; build store theo tag `vX.Y.Z`.

## Hệ quả
- Dễ hơn: lịch sử sạch, sinh changelog theo `type`, revert một PR là một commit.
- Khó hơn: mỗi lần gộp web phải bấm duyệt; PR thứ hai phải cập nhật theo `main` trước khi gộp.

## Điều kiện xem xét lại
Khi có thêm người duyệt (tăng số approval) hoặc cần kênh phát hành riêng cho beta.

## Nguồn tham khảo
- `docs/ci-cd.md`, `CLAUDE.md`
