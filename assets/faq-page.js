// Gắn ô tìm kiếm vào trang FAQ. Nội dung đã có sẵn trong HTML, nên khi JS lỗi trang vẫn đọc được.
import { filterGroups } from './faq-search.js';

function setup() {
  const form = document.querySelector('.faq-search');
  const input = form?.querySelector('input');
  const status = form?.querySelector('.faq-status');
  const empty = document.querySelector('.faq-empty');
  const groupEls = [...document.querySelectorAll('.faq-group')];
  if (!form || !input || !status || !empty || groupEls.length === 0) return;

  const groups = groupEls.map((el) => {
    const items = [...el.querySelectorAll('.faq-item')];
    return {
      el,
      items,
      count: el.querySelector('.faq-count'),
      data: {
        id: el.id,
        questions: items.map((item) => item.querySelector('.faq-question-text').textContent),
      },
    };
  });

  // Trạng thái mở/đóng do phụ huynh chọn trước khi lọc, để trả lại khi xoá từ khoá.
  let savedOpen = null;

  function apply(query) {
    const { groups: result, total } = filterGroups(groups.map((g) => g.data), query);
    const filtering = query.trim() !== '';

    if (filtering && savedOpen === null) savedOpen = groups.map((g) => g.items.map((i) => i.open));

    groups.forEach((g, gi) => {
      g.el.hidden = !result[gi].hasMatches;
      if (g.count) g.count.textContent = `${result[gi].visible.filter(Boolean).length} câu`;
      g.items.forEach((item, ii) => {
        const visible = result[gi].visible[ii];
        item.hidden = !visible;
        if (filtering) item.open = visible;
        else if (savedOpen) item.open = savedOpen[gi][ii];
      });
    });
    if (!filtering) savedOpen = null;

    empty.hidden = total > 0;
    if (!filtering) status.textContent = '';
    else if (total === 0) status.textContent = 'Không tìm thấy câu hỏi phù hợp.';
    else status.textContent = `Tìm thấy ${total} câu hỏi.`;
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('input', () => apply(input.value));
  form.hidden = false;
  if (input.value) apply(input.value);
}

setup();
