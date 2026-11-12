@AGENTS.md

## Quy trình làm ticket (Linear)

Nơi quản lý việc: **Linear**, team `GIA` (Giasutieuhoc), project "Gia sư Tiểu học — Ra mắt bản đầu"
(https://linear.app/justintran/project/gia-su-tieu-hoc-ra-mat-ban-djau-401c1c7f181e).
- Mã ticket dạng `GIA-xx`; ticket chuyển từ bảng cũ giữ mã cũ ở đầu tiêu đề (vd `GIA-22` = "GSTH-040: …").
  Chủ dự án nói "làm GSTH-040" hay "làm GIA-22" đều là cùng một ticket.
- Đọc/sửa bằng công cụ Linear (`get_issue`, `list_issues`, `save_issue`, `save_comment`, `list_comments`).
  Tiến độ và tóm tắt ghi bằng **comment** trên ticket; tick ô nghiệm thu trong mô tả khi đã đạt.
- Trạng thái: `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` (thêm `Canceled`, `Duplicate`).
- Nhóm việc là ticket cha (vd `GIA-44`), các mục là ticket con; quan hệ chặn nhau dùng `blockedBy`/`blocks`.
- Milestone của project = giai đoạn trong `docs/ke-hoach-ra-mat.md`.
- Bảng Kanban cũ (`docs/kanban/`) chỉ còn để lưu trữ, không đọc/ghi ticket ở đó nữa.

Khi chủ dự án nói "làm GIA-xx" (hoặc "làm GSTH-xxx"):
1. Đọc ticket và comment trên Linear (kèm `includeRelations`). Nếu bị ticket chưa `Done` chặn (`blockedBy`)
   hoặc còn chờ tiền/tài khoản/quyết định: dừng, báo lý do và hỏi bằng câu hỏi có lựa chọn.
2. Đóng vai đúng role mà ticket cần (PO/BA/Developer/TechLead/DevOps/QA; ghi role đã đóng trong comment) và làm phần việc
   của role đó, dùng đúng skill của role (bảng ở `.claude/SKILLS.md`, skill trong `.claude/skills/`):
   - PO: write-spec, roadmap-update, product-brainstorming · BA: write-spec
   - Developer: debug, verification-before-completion; frontend-design chỉ lấy nguyên tắc thẩm mỹ (app là
     React Native, theo `src/constants/theme.ts`); test-driven-development (chạy `npm test`, có từ GSTH-033)
     kèm tsc + lint + chạy thử trên máy giả lập
   - TechLead: architecture, `/code-review`, `/security-review`
   - DevOps: eas-release (quy trình phát hành riêng của dự án), deploy-checklist; ci-cd-and-automation chỉ tham khảo
   - QA: testing-strategy, accessibility-review (áp cho React Native: cỡ chữ, tương phản, vùng bấm 44pt,
     accessibilityLabel); kiểm thử app bằng công cụ máy giả lập iOS của Claude; webapp-testing chỉ cho bản web
   Skill có ghi chú "chỉ tham khảo"/"không dùng" ở `.claude/SKILLS.md` thì dùng phương án thay thế ghi ở đó.
   Thêm 19/10 (đã cài, nguồn và giấy phép ở `.claude/SKILLS.md`):
   - PO: game-changing-features, writing-plans, changelog-generator · BA: requirements-clarity,
     feature-design-assistant, screenshot-feature-extractor
   - Developer: react-native-architecture, mobile-design, typescript-expert, react-useeffect, systematic-debugging,
     supabase-postgres-best-practices, i18n-localization, senior-prompt-engineer, claude-api
   - TechLead: senior-architect, architecture-decision-records, database-design, security-best-practices, clean-code
   - DevOps: expo-deployment, secrets-management · QA: senior-qa, testing-patterns (sau GSTH-033), find-bugs, accessibility-auditor
   - Dùng chung cho mọi role (đồng bộ ngữ cảnh giữa Claude Code & Antigravity): các skill ai-memory (`ai-memory-retrieval`, `ai-memory-handoff`, `ai-memory-durable-pages`, `ai-memory-messaging`, `ai-memory-learning-maintenance`). Bắt đầu phiên đọc `memory_briefing`/`memory_handoff_accept`, kết thúc phiên gọi `memory_handoff_begin` và cập nhật trang `status/hien-trang.md`.
   Chỉ gọi skill có thư mục trong `.claude/skills/`; script đi kèm skill chỉ chạy khi chủ dự án đồng ý.
3. Việc có sửa code: lấy code mới nhất từ GitHub, tạo nhánh từ `main` (nhánh chính duy nhất cho cả app và web, chốt ở GIA-59): `ticket/<id>` cho app/dùng chung (ví dụ `ticket/GIA-47`), `web/<id>` cho web, commit nhỏ, chạy `npx tsc --noEmit`, `npx expo lint` và `npm test`.
4. Cập nhật Linear trong lúc làm: chuyển `In Progress` khi bắt đầu, comment tiến độ; làm xong chuyển `In Review` kèm comment tóm tắt (nhánh, commit, cách thử, việc còn lại).
5. GitHub (repo riêng tư) là bản gốc của code. Xong việc hoặc dừng giữa chừng thì đẩy nhánh lên GitHub và mở PR vào `main`, để không còn commit chỉ nằm ở máy. KHÔNG tự merge, không force-push: chỉ merge khi CI xanh và chủ dự án đã duyệt (chuyển ticket sang `Done`) hoặc nói rõ là duyệt. Gộp vào `main` là tự deploy (OTA app, Supabase, web), nên đó cũng là bước phát hành.
   Linear tự chuyển ticket sang `Done` khi gộp PR có mã `GIA-xx` trong tiêu đề: ticket còn việc dở thì kiểm lại và đưa về trạng thái cũ.
   Phiên Claude Code chạy trên cloud (claude.ai/code) chỉ đẩy lên đúng nhánh `claude/...` mà phiên được giao.
   Không đưa lên GitHub: khoá API, `.env.local`, bộ mẫu `mau-bai-tap/` và `mau-giong/` (đã có trong `.gitignore`).
6. Gặp việc bị chặn (chờ tiền, chờ tài khoản, chờ quyết định): comment lý do bắt đầu bằng "**Bị chặn:**", để ticket ở trạng thái hiện tại, báo chủ dự án.

### Lệnh "chạy": mỗi ticket một phiên song song

Chủ dự án chuyển ticket sang `Todo` hoặc `In Progress` rồi nhắn "chạy". Phiên nhận lệnh (phiên điều phối) làm:
1. Đọc các ticket `In Progress` của project chưa có comment "Đang chạy ở phiên …" còn hiệu lực.
   Bỏ qua (và báo lại) ticket bị chặn.
2. Mỗi ticket còn lại: mở một phiên song song (`start_session`, initiation `user_asked`, context `fresh`,
   `use_worktree: true`, tên `GIA-xx: <tiêu đề>`), rồi comment "Đang chạy ở phiên …" vào ticket.
3. Brief cho mỗi phiên gồm: link ticket Linear, mã ticket, role, skill của role, tiêu chí nghiệm thu, và quy tắc:
   - Đọc ticket và comment trên Linear trước khi làm; làm trong nhánh `ticket/<id>`; commit nhỏ; tsc + lint + test.
   - Không merge, không deploy lên máy chủ hay gửi cập nhật OTA trừ khi ticket là việc
     DevOps đã được chủ dự án cho phép trong ticket.
   - Xong: đẩy nhánh lên GitHub, mở PR vào `main`, chuyển ticket sang `In Review`, comment tóm tắt (nhánh, PR, commit, cách thử, việc còn lại).
     Bị chặn giữa chừng: comment "**Bị chặn:** …".
4. Khi phiên con báo xong: phiên điều phối kiểm tra nhánh/commit thật, rồi báo chủ dự án một dòng cho mỗi ticket.
