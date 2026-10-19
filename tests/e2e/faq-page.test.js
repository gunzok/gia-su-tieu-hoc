import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { startServer } from '../../scripts/serve.js';
import { normalizeText } from '../../assets/faq-search.js';

let server;
let browser;
let baseUrl;

before(async () => {
  server = await startServer(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((done) => server?.close(done));
});

async function openFaq({ width = 375, height = 667, javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled });
  context.setDefaultTimeout(5000);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(`${baseUrl}/faq`);
  return { page, context, errors };
}

const search = (page) => page.getByRole('searchbox', { name: 'Tìm câu hỏi' });
const visibleQuestions = (page) =>
  page.locator('.faq-item:visible .faq-question-text').allTextContents();
const emptyMessage = (page) => page.locator('.faq-empty', { hasText: 'Không tìm thấy câu hỏi phù hợp' });
const visibleGroupTitles = (page) => page.locator('.faq-group:visible h2').allTextContents();

test('AC1: /faq có 8–10 câu hỏi, đúng 2 nhóm Lịch học và Học phí, mỗi nhóm ≥ 3 câu', async () => {
  const { page, context, errors } = await openFaq();
  const titles = await page.locator('.faq-group h2').allTextContents();
  assert.deepEqual(titles.map((t) => t.replace(/\d+ câu/, '').trim()), ['Lịch học', 'Học phí']);
  const total = await page.locator('.faq-item').count();
  assert.ok(total >= 8 && total <= 10, `có ${total} câu hỏi`);
  for (const group of await page.locator('.faq-group').all()) {
    assert.ok((await group.locator('.faq-item').count()) >= 3);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test('AC2 + AC4: lọc theo nội dung câu hỏi, không phân biệt hoa/thường và dấu', async () => {
  const { page, context } = await openFaq();
  const all = await visibleQuestions(page);

  await search(page).fill('Học phí');
  const accented = await visibleQuestions(page);
  assert.ok(accented.length > 0 && accented.length < all.length);
  for (const q of accented) assert.ok(normalizeText(q).includes('hoc phi'), q);
  const expected = all.filter((q) => normalizeText(q).includes('hoc phi'));
  assert.deepEqual(accented, expected);

  for (const kw of ['hoc phi', 'HOC PHI', 'HỌC PHÍ', '  học phí  ']) {
    await search(page).fill(kw);
    assert.deepEqual(await visibleQuestions(page), accented, `từ khoá "${kw}"`);
  }

  await search(page).fill('doi lich');
  const doiLich = await visibleQuestions(page);
  assert.ok(doiLich.length >= 1 && doiLich.every((q) => normalizeText(q).includes('doi lich')));
  await context.close();
});

test('AC5 + E6: không có kết quả thì hiện thông báo và ẩn cả 2 nhóm', async () => {
  const { page, context } = await openFaq();
  const empty = emptyMessage(page);
  assert.equal(await empty.isVisible(), false);
  await search(page).fill('xyz không có');
  assert.equal(await empty.isVisible(), true);
  assert.deepEqual(await visibleGroupTitles(page), []);
  await context.close();
});

test('AC6 + E1: xoá từ khoá hoặc chỉ còn khoảng trắng thì hiện lại tất cả', async () => {
  const { page, context } = await openFaq();
  const total = await page.locator('.faq-item').count();
  await search(page).fill('học thử');
  assert.ok((await visibleQuestions(page)).length < total);
  await search(page).fill('   ');
  assert.equal((await visibleQuestions(page)).length, total);
  await search(page).fill('');
  assert.equal((await visibleQuestions(page)).length, total);
  assert.equal(await emptyMessage(page).isVisible(), false);
  assert.equal((await visibleGroupTitles(page)).length, 2);
  await context.close();
});

test('AC7 + E7: nhóm không còn câu khớp thì ẩn tiêu đề, nhóm còn câu khớp vẫn hiện', async () => {
  const { page, context } = await openFaq();
  await search(page).fill('hoàn học phí');
  const titles = await visibleGroupTitles(page);
  assert.equal(titles.length, 1);
  assert.match(titles[0], /Học phí/);
  assert.match(titles[0], /1 câu/, 'số câu của nhóm cập nhật theo kết quả lọc');
  await search(page).fill('');
  assert.deepEqual(
    (await visibleGroupTitles(page)).map((t) => t.match(/\d+ câu/)[0]),
    ['5 câu', '5 câu'],
  );
  await context.close();
});

test('E4 + E5: ký tự đặc biệt và từ khoá rất dài không gây lỗi', async () => {
  const { page, context, errors } = await openFaq();
  for (const kw of ['(*[?.', '.*', 'học phí '.repeat(50)]) {
    await search(page).fill(kw);
    assert.equal(await emptyMessage(page).isVisible(), true, kw);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test('AC8: mở câu trả lời bằng bàn phím (Tab rồi Enter/Space)', async () => {
  const { page, context } = await openFaq();
  await search(page).focus();
  await page.keyboard.press('Tab');
  const first = page.locator('.faq-item').first();
  assert.equal(await first.locator('summary').evaluate((el) => el === document.activeElement), true);
  const answer = first.locator('.faq-answer');
  assert.equal(await answer.isVisible(), false);
  await page.keyboard.press('Enter');
  assert.equal(await answer.isVisible(), true);
  await page.keyboard.press('Space');
  assert.equal(await answer.isVisible(), false);
  await context.close();
});

test('AC8 (Q4): khi đang lọc, câu khớp tự mở; xoá từ khoá thì trở lại trạng thái trước', async () => {
  const { page, context } = await openFaq();
  await search(page).fill('học thử');
  const match = page.locator('.faq-item:visible');
  assert.equal(await match.count(), 1);
  assert.equal(await match.locator('.faq-answer').isVisible(), true);
  await search(page).fill('');
  assert.equal(await page.locator('.faq-item[open]').count(), 0);
  await context.close();
});

test('AC9: ô tìm kiếm có nhãn, vùng aria-live báo số kết quả', async () => {
  const { page, context } = await openFaq();
  assert.equal(await search(page).count(), 1);
  const status = page.locator('[role="status"][aria-live="polite"]');
  assert.equal(await status.count(), 1);
  await search(page).fill('hoc phi');
  const n = (await visibleQuestions(page)).length;
  assert.match(await status.textContent(), new RegExp(`${n} câu hỏi`));
  await search(page).fill('xyz');
  assert.match(await status.textContent(), /Không tìm thấy câu hỏi phù hợp/);
  await context.close();
});

for (const height of [667, 812]) {
  test(`AC3 + AC10: 375×${height} không cuộn ngang, vùng chạm ≥ 44px, chữ ≥ 16px`, async () => {
    const { page, context } = await openFaq({ width: 375, height });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(scrollWidth <= 375, `scrollWidth = ${scrollWidth}`);

    const box = await search(page).boundingBox();
    assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= 375);

    await page.locator('.faq-item summary').first().click();
    const metrics = await page.evaluate(() => {
      const px = (el) => parseFloat(getComputedStyle(el).fontSize);
      const summaries = [...document.querySelectorAll('.faq-item summary')];
      return {
        minSummaryHeight: Math.min(...summaries.map((s) => s.getBoundingClientRect().height)),
        overflowing: summaries.filter((s) => s.getBoundingClientRect().right > 375).length,
        fontSizes: [
          ...summaries,
          document.querySelector('.faq-search input'),
          document.querySelector('.faq-item[open] .faq-answer'),
          document.querySelector('.faq-intro'),
        ].map(px),
      };
    });
    assert.ok(metrics.minSummaryHeight >= 44, `summary cao ${metrics.minSummaryHeight}px`);
    assert.equal(metrics.overflowing, 0);
    assert.ok(Math.min(...metrics.fontSizes) >= 16, `cỡ chữ nhỏ nhất ${Math.min(...metrics.fontSizes)}px`);
    await context.close();
  });
}

test('E10: tắt JavaScript vẫn đọc được toàn bộ câu hỏi và câu trả lời', async () => {
  const { page, context } = await openFaq({ javaScriptEnabled: false });
  const total = await page.locator('.faq-item').count();
  assert.ok(total >= 8);
  assert.equal(await page.locator('.faq-answer').count(), total);
  assert.equal(await page.locator('.faq-search').isVisible(), false, 'ô tìm kiếm không dùng được thì ẩn đi');
  await context.close();
});

test('E11: màn hình rộng 1280px, nội dung có chiều rộng tối đa hợp lý', async () => {
  const { page, context } = await openFaq({ width: 1280, height: 800 });
  const width = await page.locator('.faq-list').evaluate((el) => el.getBoundingClientRect().width);
  assert.ok(width <= 800, `danh sách rộng ${width}px`);
  await context.close();
});
