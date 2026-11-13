# ADR-003: Gemini làm AI chính cho bản thử, Claude dự phòng

- **Trạng thái**: Đã chấp nhận có điều kiện (ghi hồi tố 2026-11-13) — xem rủi ro R-001
- **Ngày**: 2026-11-06 (GIA-19) · 2026-11-07 (luật cho web)
- **Người quyết định**: chủ dự án

## Bối cảnh
Ban đầu chấm bằng Claude (đọc ảnh tốt, trả phí). Giai đoạn thử cần chi phí gần bằng 0. Đo bộ 10 ảnh mẫu (21 lỗi):
Claude Opus 21/21, Gemini 21/21, LM Studio 8B 14/21.

## Các phương án đã xét
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Gemini gói miễn phí làm chính | Không tốn tiền, chất lượng ngang Claude trên bộ mẫu | Điều khoản không cho app hướng tới người dưới 18 tuổi; dữ liệu gửi lên có thể được dùng; giới hạn lượt |
| Claude cho tất cả | Điều khoản và chất lượng ổn định | Tốn tiền mỗi lượt |
| LM Studio tại nhà | Miễn phí, riêng tư | Chậm (4-8 phút/bài), kém chính xác; chỉ dùng khi phát triển |

## Quyết định
Gemini chính (nhiều model, né model hết lượt), Claude dự phòng cho app và cho người có Plus. Web chưa Plus chỉ Gemini, lỗi thì báo bận.
Không luân phiên nhiều khoá Gemini để vượt hạn mức. LM Studio không có trên web.

## Hệ quả
- Dễ hơn: chạy thử với chi phí gần 0.
- Khó hơn: không được mở rộng ra người ngoài nhóm thử cho đến khi xử lý điều khoản (GIA-21).

## Điều kiện xem xét lại
Trước khi mở web/app ra ngoài nhóm thử, hoặc khi bật thanh toán Gemini / Claude.

## Nguồn tham khảo
- `docs/gemini.md`; comment GIA-19 (kết quả đo)
