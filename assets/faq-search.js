// Logic tìm kiếm FAQ, không phụ thuộc DOM để chạy được cả trong trình duyệt lẫn Node (unit test).

const COMBINING_MARKS = /[̀-ͯ]/g;
const WHITESPACE = /\s+/g;

// Đưa chuỗi về dạng so khớp: bỏ dấu, đ → d, chữ thường, gộp khoảng trắng.
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(WHITESPACE, ' ')
    .trim();
}

// So khớp theo cụm liên tiếp (substring), không dùng regex nên ký tự đặc biệt được hiểu đúng nghĩa đen.
export function matchesQuery(question, query) {
  const needle = normalizeText(query);
  if (needle === '') return true;
  return normalizeText(question).includes(needle);
}

// groups: [{ id, questions: [string] }] → trạng thái hiển thị của từng câu và từng nhóm.
export function filterGroups(groups, query) {
  let total = 0;
  const result = groups.map(({ id, questions }) => {
    const visible = questions.map((q) => matchesQuery(q, query));
    const count = visible.filter(Boolean).length;
    total += count;
    return { id, visible, hasMatches: count > 0 };
  });
  return { groups: result, total };
}
