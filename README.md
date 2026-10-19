# Gia sư tiểu học

Website tĩnh (HTML/CSS/JS thuần, không build step) cho dịch vụ gia sư tiểu học.

| Trang | File |
|---|---|
| `/faq`: câu hỏi thường gặp cho phụ huynh (GSTH-001) | `faq/index.html` |

## Chạy và kiểm thử

Cần Node.js ≥ 20.

```bash
npm install
npm start          # http://127.0.0.1:8080/faq
npm run lint       # ESLint
npm test           # unit test (node:test) + E2E (Playwright, Chromium)
```

- `assets/faq-search.js`: logic tìm kiếm thuần (bỏ dấu, không phân biệt hoa/thường), có unit test ở `tests/unit/`.
- `assets/faq-page.js`: gắn ô tìm kiếm vào trang. Nội dung FAQ nằm sẵn trong HTML nên tắt JavaScript vẫn đọc được.
- `tests/e2e/`: kiểm AC của spec `docs/specs/GSTH-001-faq-phu-huynh.md` ở viewport 375px và 1280px.
