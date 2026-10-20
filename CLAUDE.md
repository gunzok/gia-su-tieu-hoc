@AGENTS.md

## Quy trình làm ticket (bảng Kanban)

Bảng việc: https://claude.ai/artifact/D3cZmK11wcXTM8AHEGYipq
- Mã nguồn bảng: `docs/kanban/bang-cong-viec.html`; ticket nằm trong kho dữ liệu của artifact, collection `tickets`, mỗi ticket một document có id `GSTH-xxx`.
- Đọc/sửa ticket bằng công cụ `ArtifactData` (url ở trên): luôn `get` trước rồi ghi kèm `if_version`; thêm ghi chú vào mảng `notes` (`{at, by, text}`), cập nhật `updatedAt`.
- Các trường: `id, title, description, type (Epic/Story/Bug), status, assigneeId, originalDeveloperId, role, ownerRole, acceptanceCriteria[], dependsOn[], isBlocked, blockReason, notes[], runningSession`.
- Người phụ trách: collection `users` (`id, name, initials, role, color`), mô hình đầy đủ ở `docs/kanban/mo-hinh-du-lieu.js`.
- 8 cột (`status`): `idea, analysis, ready_for_dev, coding (WIP 2), review, ready_for_qa, testing (WIP 2), done`.
- Tự gán người khi chuyển cột: `analysis` → người role BA, `review` → TechLead, `testing` → QA; `ready_for_dev`/`coding` → `originalDeveloperId` (lần đầu vào `coding` thì ghi nhớ người đó), nên `testing` → `coding` trả bug về đúng Developer đã code. Luôn cập nhật cả `assigneeId` và `role`. Khi Claude tự đổi `status`, làm đúng các quy tắc này và không vượt giới hạn WIP.

Khi chủ dự án nói "làm GSTH-xxx":
1. Đọc ticket trên bảng. Nếu `isBlocked` hoặc ticket trong `dependsOn` chưa `done`: dừng, báo lý do và hỏi bằng câu hỏi có lựa chọn.
2. Đóng vai đúng `role` của ticket (PO/BA/Developer/TechLead/DevOps/QA) và làm phần việc của role đó,
   dùng đúng skill của role (bảng ở `.claude/SKILLS.md`, skill trong `.claude/skills/`; danh sách và
   mức độ hợp với app nằm ở collection `roles` trên bảng, nút "Role & skill"):
   - PO: write-spec, roadmap-update, product-brainstorming · BA: write-spec
   - Developer: debug, verification-before-completion; frontend-design chỉ lấy nguyên tắc thẩm mỹ (app là
     React Native, theo `src/constants/theme.ts`); test-driven-development (chạy `npm test`, có từ GSTH-033)
     kèm tsc + lint + chạy thử trên máy giả lập
   - TechLead: architecture, `/code-review`, `/security-review`
   - DevOps: eas-release (quy trình phát hành riêng của dự án), deploy-checklist; ci-cd-and-automation chỉ tham khảo
   - QA: testing-strategy, accessibility-review (áp cho React Native: cỡ chữ, tương phản, vùng bấm 44pt,
     accessibilityLabel); kiểm thử app bằng công cụ máy giả lập iOS của Claude; webapp-testing chỉ cho bản web
   Skill đánh dấu "không hợp" trên bảng thì dùng phương án thay thế ghi ở đó.
   Thêm 19/10 (đã cài, nguồn và giấy phép ở `.claude/SKILLS.md`):
   - PO: game-changing-features, writing-plans, changelog-generator · BA: requirements-clarity,
     feature-design-assistant, screenshot-feature-extractor
   - Developer: react-native-architecture, mobile-design, typescript-expert, react-useeffect, systematic-debugging,
     supabase-postgres-best-practices, i18n-localization, senior-prompt-engineer, claude-api
   - TechLead: senior-architect, architecture-decision-records, database-design, security-best-practices, clean-code
   - DevOps: expo-deployment, secrets-management · QA: senior-qa, testing-patterns (sau GSTH-033), find-bugs, accessibility-auditor
   - Dùng chung cho mọi role (đồng bộ ngữ cảnh giữa Claude Code & Antigravity): các skill ai-memory (`ai-memory-retrieval`, `ai-memory-handoff`, `ai-memory-durable-pages`, `ai-memory-messaging`, `ai-memory-learning-maintenance`). Bắt đầu phiên đọc `memory_briefing`/`memory_handoff_accept`, kết thúc phiên gọi `memory_handoff_begin` và cập nhật trang `status/hien-trang.md`.
   Chỉ gọi skill có thư mục trong `.claude/skills/`; script đi kèm skill chỉ chạy khi chủ dự án đồng ý.
3. Việc có sửa code: tạo nhánh local `ticket/<id>` (ví dụ `ticket/GSTH-018`) từ nhánh chính đang dùng (`setup/khung-du-an`), commit nhỏ, chạy `npx tsc --noEmit` và `npx expo lint`.
4. Cập nhật bảng trong lúc làm: chuyển `coding` khi bắt đầu, ghi chú tiến độ; làm xong chuyển sang `review` kèm ghi chú tóm tắt (nhánh, commit, cách thử).
5. KHÔNG tự merge, KHÔNG push GitHub. Chỉ merge `ticket/<id>` vào nhánh chính local khi chủ dự án đã duyệt trên bảng (chuyển ticket khỏi `review`) hoặc nói rõ là duyệt.
6. Gặp việc bị chặn (chờ tiền, chờ tài khoản, chờ quyết định): đặt `isBlocked: true` và `blockReason`, báo chủ dự án.

### Lệnh "chạy": mỗi ticket một phiên song song

Chủ dự án kéo ticket vào cột `coding` trên bảng rồi nhắn "chạy". Phiên nhận lệnh (phiên điều phối) làm:
1. Đọc collection `tickets`, lấy các ticket `status: coding` chưa có `runningSession`.
   Bỏ qua (và báo lại) ticket `isBlocked` hoặc còn `dependsOn` chưa `done`.
2. Mỗi ticket còn lại: mở một phiên song song bằng `start_session` (initiation `user_asked`, context `fresh`,
   `use_worktree: true`, tên `GSTH-xxx: <tiêu đề>`), rồi ghi `runningSession` (tên/id phiên) và một ghi chú
   "Đang chạy ở phiên …" vào ticket (đọc trước, ghi kèm `if_version`).
3. Brief cho mỗi phiên gồm: url bảng, mã ticket, role, skill của role, tiêu chí nghiệm thu, và quy tắc:
   - Đọc ticket bằng `ArtifactData` trước khi làm; làm trong nhánh local `ticket/<id>`; commit nhỏ; tsc + lint.
   - Không merge, không push GitHub, không deploy lên máy chủ hay gửi cập nhật OTA trừ khi ticket là việc
     DevOps đã được chủ dự án cho phép trong ticket.
   - Xong: cập nhật ticket `status: review`, `role: TechLead`, xoá `runningSession`, thêm ghi chú tóm tắt
     (nhánh, commit, cách thử, việc còn lại). Bị chặn giữa chừng: `isBlocked: true` + `blockReason`, xoá `runningSession`.
4. Khi phiên con báo xong: phiên điều phối kiểm tra nhánh/commit thật, rồi báo chủ dự án một dòng cho mỗi ticket.
