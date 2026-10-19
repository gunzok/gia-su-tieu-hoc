import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeText, matchesQuery, filterGroups } from '../../assets/faq-search.js';

test('normalizeText bỏ dấu tiếng Việt và chuyển về chữ thường', () => {
  assert.equal(normalizeText('Học phí'), 'hoc phi');
  assert.equal(normalizeText('HỌC PHÍ'), 'hoc phi');
  assert.equal(normalizeText('Nếu con nghỉ một buổi'), 'neu con nghi mot buoi');
});

test('normalizeText đổi đ/Đ thành d (R3)', () => {
  assert.equal(normalizeText('đổi lịch'), 'doi lich');
  assert.equal(normalizeText('ĐỔI LỊCH'), 'doi lich');
});

test('normalizeText chấp nhận chuỗi tổ hợp (NFD) như chuỗi dựng sẵn (NFC)', () => {
  assert.equal(normalizeText('Học phí'.normalize('NFD')), 'hoc phi');
});

test('normalizeText cắt khoảng trắng đầu/cuối và gộp khoảng trắng giữa (E2)', () => {
  assert.equal(normalizeText('  học   phí \n'), 'hoc phi');
  assert.equal(normalizeText('   '), '');
});

test('normalizeText trả về chuỗi rỗng khi đầu vào không phải chuỗi', () => {
  assert.equal(normalizeText(undefined), '');
  assert.equal(normalizeText(null), '');
});

test('matchesQuery: từ khoá rỗng hoặc chỉ khoảng trắng khớp mọi câu (AC6, E1)', () => {
  assert.equal(matchesQuery('Học phí tính thế nào?', ''), true);
  assert.equal(matchesQuery('Học phí tính thế nào?', '    '), true);
});

test('matchesQuery không phân biệt hoa/thường và dấu (AC4)', () => {
  const q = 'Học phí được tính theo buổi hay theo tháng?';
  for (const kw of ['Học phí', 'hoc phi', 'HOC PHI', 'HỌC PHÍ', '  học phí ']) {
    assert.equal(matchesQuery(q, kw), true, `"${kw}" phải khớp`);
  }
  assert.equal(matchesQuery('Có thể đổi lịch học không?', 'doi lich'), true);
});

test('matchesQuery khớp theo cụm liên tiếp, không theo từ rời (E9)', () => {
  const q = 'Học phí được tính theo buổi hay theo tháng?';
  assert.equal(matchesQuery(q, 'tính theo buổi'), true);
  assert.equal(matchesQuery(q, 'tháng học phí'), false);
});

test('matchesQuery coi ký tự đặc biệt là chữ thường, không phải regex (E4)', () => {
  const q = 'Một buổi học kéo dài bao lâu?';
  assert.doesNotThrow(() => matchesQuery(q, '(*['));
  assert.equal(matchesQuery(q, '(*['), false);
  assert.equal(matchesQuery(q, '.*'), false);
  assert.equal(matchesQuery(q, 'bao lâu?'), true);
});

test('matchesQuery với từ khoá rất dài không lỗi và không khớp (E5)', () => {
  assert.equal(matchesQuery('Học phí?', 'học phí '.repeat(200)), false);
});

const groups = [
  { id: 'lich-hoc', questions: ['Một buổi học kéo dài bao lâu?', 'Có thể đổi lịch học không?'] },
  { id: 'hoc-phi', questions: ['Học phí tính theo buổi hay tháng?', 'Có được học thử không?'] },
];

test('filterGroups trả về câu khớp theo từng nhóm và tổng số kết quả', () => {
  const result = filterGroups(groups, 'hoc phi');
  assert.deepEqual(result.groups, [
    { id: 'lich-hoc', visible: [false, false], hasMatches: false },
    { id: 'hoc-phi', visible: [true, false], hasMatches: true },
  ]);
  assert.equal(result.total, 1);
});

test('filterGroups với từ khoá rỗng hiện tất cả (AC6)', () => {
  const result = filterGroups(groups, '  ');
  assert.equal(result.total, 4);
  assert.ok(result.groups.every((g) => g.hasMatches && g.visible.every(Boolean)));
});

test('filterGroups không khớp câu nào thì tổng bằng 0 và mọi nhóm ẩn (E6)', () => {
  const result = filterGroups(groups, 'xyz');
  assert.equal(result.total, 0);
  assert.ok(result.groups.every((g) => !g.hasMatches));
});
