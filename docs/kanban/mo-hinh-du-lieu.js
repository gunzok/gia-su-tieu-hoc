// Mô hình dữ liệu bảng Kanban "Bảng việc Gia sư Tiểu học" (bước 1–2 theo hướng dẫn MVP).
// Dữ liệu thật nằm trong kho của artifact (https://claude.ai/artifact/D3cZmK11wcXTM8AHEGYipq):
//   collection `users`   — người phụ trách (mỗi role ít nhất 1 người)
//   collection `tickets` — ticket GSTH-xxx (33 ticket thật)
//   collection `roles`   — skill của từng role (đã có)
// File này là bản tham chiếu; trang bảng dùng đúng các hằng số và quy tắc dưới đây.

/** @typedef {'PO' | 'BA' | 'Developer' | 'QA' | 'DevOps' | 'TechLead'} Role */

/**
 * Người phụ trách. Dữ liệu giả để gán ticket; đổi tên được trên bảng sau này.
 * @typedef {Object} User
 * @property {string} id        Mã người, ví dụ "u-dev-1"
 * @property {string} name      Tên hiển thị
 * @property {string} initials  Chữ viết tắt trên avatar (2 ký tự)
 * @property {Role}   role
 * @property {string} color     Màu nền avatar (token màu của bảng)
 */

/**
 * Ticket. Các trường mới so với bảng hiện tại: assigneeId, originalDeveloperId.
 * Giữ các trường cũ để không mất dữ liệu (role, ownerRole, notes…).
 * @typedef {Object} Ticket
 * @property {string}   id                   "GSTH-001"…
 * @property {string}   title
 * @property {string}   description
 * @property {Status}   status               Một trong 8 cột bên dưới
 * @property {string}   assigneeId           User.id đang phụ trách
 * @property {'Epic'|'Story'|'Bug'} type
 * @property {boolean}  isBlocked
 * @property {string}   blockReason          Lý do bị chặn (rỗng nếu không chặn)
 * @property {string[]} acceptanceCriteria
 * @property {string}  [originalDeveloperId] Developer đã code ticket (để QA trả bug về đúng người)
 * @property {string[]} dependsOn            Mã ticket phải xong trước
 * @property {Role}     role                 Role của người đang phụ trách (suy ra từ assigneeId)
 * @property {Role}     ownerRole            Role gốc của ticket
 * @property {{at: string, by: string, text: string}[]} notes
 * @property {string}  [runningSession]      Phiên Claude đang chạy ticket (lệnh "chạy")
 * @property {string}   createdAt
 * @property {string}   updatedAt
 */

/** @typedef {'idea'|'analysis'|'ready_for_dev'|'coding'|'review'|'ready_for_qa'|'testing'|'done'} Status */

/** 8 cột theo đúng thứ tự quy trình. `wip`: giới hạn số thẻ đang làm. */
export const COLUMNS = [
  { key: 'idea', name: 'Business Backlog', owner: 'PO' },
  { key: 'analysis', name: 'Analysis / Story Writing', owner: 'BA' },
  { key: 'ready_for_dev', name: 'Ready for Dev' },
  { key: 'coding', name: 'In Progress / Coding', owner: 'Developer', wip: 2 },
  { key: 'review', name: 'Code Review / PR', owner: 'TechLead' },
  { key: 'ready_for_qa', name: 'Ready for QA' },
  { key: 'testing', name: 'Testing', owner: 'QA', wip: 2 },
  { key: 'done', name: 'Done' },
];

/** Người giả: mỗi role 1 người, Developer 2 người để thấy rõ quy tắc "trả bug về đúng Developer". */
export const USERS = [
  { id: 'u-po', name: 'Minh Anh', initials: 'MA', role: 'PO', color: 'amber' },
  { id: 'u-ba', name: 'Thu Hà', initials: 'TH', role: 'BA', color: 'violet' },
  { id: 'u-dev-1', name: 'Quốc Bảo', initials: 'QB', role: 'Developer', color: 'teal' },
  { id: 'u-dev-2', name: 'Gia Huy', initials: 'GH', role: 'Developer', color: 'blue' },
  { id: 'u-tl', name: 'Đức Long', initials: 'ĐL', role: 'TechLead', color: 'slate' },
  { id: 'u-qa', name: 'Lan Chi', initials: 'LC', role: 'QA', color: 'coral' },
  { id: 'u-devops', name: 'Văn Nam', initials: 'VN', role: 'DevOps', color: 'green' },
];

/** Quy tắc 1 — tự gán khi thả vào cột: cột → role được gán. */
export const AUTO_ASSIGN = { analysis: 'BA', review: 'TechLead', testing: 'QA' };

/** Chọn người cho một role: người đầu tiên có role đó (sau này có thể chọn người ít việc nhất). */
export function userForRole(users, role) {
  return users.find((u) => u.role === role) ?? null;
}

/**
 * Quy tắc khi chuyển cột (bước 4 sẽ dùng). Trả về các trường cần ghi vào ticket.
 * - Vào analysis / review / testing: gán người có role tương ứng (quy tắc 1).
 * - Vào coding: nếu ticket đang do Developer phụ trách thì ghi nhớ làm originalDeveloperId.
 * - testing → coding (QA tìm thấy bug): gán lại đúng originalDeveloperId (quy tắc 2).
 */
export function transition(ticket, to, users) {
  const patch = { status: to };
  const dev = users.find((u) => u.id === ticket.originalDeveloperId);
  if (AUTO_ASSIGN[to]) {
    const u = userForRole(users, AUTO_ASSIGN[to]);
    if (u) Object.assign(patch, { assigneeId: u.id, role: u.role });
  } else if (to === 'coding' || to === 'ready_for_dev') {
    const current = users.find((u) => u.id === ticket.assigneeId);
    const owner = dev ?? (current && current.role === ticket.ownerRole ? current : userForRole(users, ticket.ownerRole));
    if (owner) Object.assign(patch, { assigneeId: owner.id, role: owner.role });
    if (to === 'coding' && owner && !ticket.originalDeveloperId) patch.originalDeveloperId = owner.id;
  }
  return patch;
}

/** Quy tắc 3 — thông báo. */
export const TOASTS = {
  done: (id) => `Ticket ${id} is ready for release!`,
  blocked: (id) => `Alert: Ticket ${id} is blocked and requires immediate attention!`,
};

/**
 * Chuyển 33 ticket hiện có sang mô hình mới (chạy một lần khi duyệt):
 * - assigneeId: theo `role` hiện tại của ticket → USERS (Developer: u-dev-1).
 * - originalDeveloperId: ticket đã/đang qua tay Developer (có devRole, hoặc status từ coding trở đi
 *   và ownerRole là Developer) → u-dev-1; còn lại để trống.
 */
export function migrateTicket(t, users) {
  const assignee = userForRole(users, t.role) ?? userForRole(users, t.ownerRole);
  const pastCoding = ['coding', 'review', 'ready_for_qa', 'testing', 'done'].includes(t.status);
  const devUser = userForRole(users, t.ownerRole === 'Developer' ? 'Developer' : t.ownerRole);
  return {
    assigneeId: assignee?.id ?? '',
    ...(pastCoding || t.devRole ? { originalDeveloperId: devUser?.id ?? '' } : {}),
  };
}
