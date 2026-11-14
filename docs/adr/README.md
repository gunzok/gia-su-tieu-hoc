# Quyết định kiến trúc (ADR)

Mỗi quyết định kỹ thuật lớn là một file `ADR-xxx-ten-ngan.md` theo mẫu bên dưới. Không sửa nội dung ADR đã chấp nhận:
muốn đổi thì viết ADR mới và ghi "Đã thay thế bởi ADR-yyy" ở ADR cũ. ADR-001 đến ADR-006 được ghi hồi tố ngày 13/11/2026
(GIA-75) từ các quyết định đã thực hiện trước đó.

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [001](ADR-001-expo-mot-ma-nguon.md) | Expo + expo-router, một mã nguồn cho iOS, Android và web | Đã chấp nhận |
| [002](ADR-002-supabase.md) | Supabase làm máy chủ (Auth, Postgres + RLS, Storage, Edge Functions) | Đã chấp nhận |
| [003](ADR-003-ai-cham-bai.md) | Gemini làm AI chính cho bản thử, Claude dự phòng | Đã chấp nhận (có điều kiện) |
| [004](ADR-004-cloudflare-workers.md) | Web tĩnh trên Cloudflare Workers | Đã chấp nhận |
| [005](ADR-005-nhanh-main-squash.md) | `main` duy nhất, PR + CI, squash, Conventional Commits | Đã chấp nhận |
| [006](ADR-006-moi-dung-thu.md) | Web chỉ cho người được mời, nhận diện bằng `Origin`, giới hạn lượt | Đã chấp nhận (danh sách mời thay bởi ADR-007 khi được duyệt) |
| [007](ADR-007-mo-web-cong-khai.md) | Mở web công khai: giữ CAPTCHA tắt, dựa vào giới hạn tốc độ + lượt + cầu dao; Turnstile khi app có build mới | Đề xuất |

## Mẫu

```markdown
# ADR-xxx: Tiêu đề

- **Trạng thái**: Đề xuất / Đã chấp nhận / Đã thay thế bởi ADR-yyy
- **Ngày**: YYYY-MM-DD
- **Người quyết định**: chủ dự án

## Bối cảnh
## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
## Quyết định
## Hệ quả
## Điều kiện xem xét lại
## Nguồn tham khảo
```
