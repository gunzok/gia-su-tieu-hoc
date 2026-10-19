@AGENTS.md

## Quy trình làm ticket (bảng Kanban)

Bảng việc: https://claude.ai/artifact/D3cZmK11wcXTM8AHEGYipq
- Mã nguồn bảng: `docs/kanban/bang-cong-viec.html`; ticket nằm trong kho dữ liệu của artifact, collection `tickets`, mỗi ticket một document có id `GSTH-xxx`.
- Đọc/sửa ticket bằng công cụ `ArtifactData` (url ở trên): luôn `get` trước rồi ghi kèm `if_version`; thêm ghi chú vào mảng `notes` (`{at, by, text}`), cập nhật `updatedAt`.
- Các trường: `id, title, description, type (Epic/Story/Bug), role, ownerRole, devRole, acceptanceCriteria[], dependsOn[], isBlocked, blockReason, status, notes[]`.
- 8 cột (`status`): `idea, analysis, ready_for_dev, coding (WIP 2), review, ready_for_qa, testing (WIP 2), done`.
- Gán role tự động khi chuyển cột: `analysis` → BA, `review` → TechLead, `testing` → QA; `ready_for_dev`/`coding` → Developer phụ trách (`devRole`, mặc định `ownerRole`), nên `testing` → `coding` trả về đúng Developer cũ. Khi Claude tự đổi `status`, làm đúng các quy tắc này và không vượt giới hạn WIP.

Khi chủ dự án nói "làm GSTH-xxx":
1. Đọc ticket trên bảng. Nếu `isBlocked` hoặc ticket trong `dependsOn` chưa `done`: dừng, báo lý do và hỏi bằng câu hỏi có lựa chọn.
2. Đóng vai đúng `role` của ticket (PO/BA/Developer/TechLead/DevOps/QA) và làm phần việc của role đó.
3. Việc có sửa code: tạo nhánh local `ticket/<id>` (ví dụ `ticket/GSTH-018`) từ nhánh chính đang dùng (`setup/khung-du-an`), commit nhỏ, chạy `npx tsc --noEmit` và `npx expo lint`.
4. Cập nhật bảng trong lúc làm: chuyển `coding` khi bắt đầu, ghi chú tiến độ; làm xong chuyển sang `review` kèm ghi chú tóm tắt (nhánh, commit, cách thử).
5. KHÔNG tự merge, KHÔNG push GitHub. Chỉ merge `ticket/<id>` vào nhánh chính local khi chủ dự án đã duyệt trên bảng (chuyển ticket khỏi `review`) hoặc nói rõ là duyệt.
6. Gặp việc bị chặn (chờ tiền, chờ tài khoản, chờ quyết định): đặt `isBlocked: true` và `blockReason`, báo chủ dự án.
