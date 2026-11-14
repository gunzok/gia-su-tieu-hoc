// GIA-84: kiểm cấu trúc hai hàm máy chủ (Deno, jest không chạy được) để luật chi phí không bị gỡ nhầm:
// cầu dao tổng không nằm trong nhánh chỉ dành cho web, thứ tự AI chỉ dựa vào gói Plus, chưa Plus lỗi AI thì báo bận.
const fs = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
const read = (file: string) => fs.readFileSync(`${process.cwd()}/${file}`, 'utf8');

describe.each(['cham-bai', 'hoi-co'])('supabase/functions/%s', (name) => {
  const source = read(`supabase/functions/${name}/index.ts`);

  it('cầu dao tổng áp cho mọi yêu cầu, không chỉ khi có Origin', () => {
    expect(source).toMatch(/globalBreakerTripped\(/);
    expect(source).not.toMatch(/if \(browser\)/);
  });

  it('thứ tự AI chỉ dựa vào gói Plus (không dựa vào Origin)', () => {
    expect(source).toMatch(/engineOrderFor\([\s\S]*?\{ plus \},?\s*\)/);
    expect(source).not.toMatch(/\{ plus, browser \}/);
  });

  it('chưa Plus mà AI miễn phí lỗi thì báo bận (503), không đẩy sang Claude', () => {
    expect(source).toMatch(/if \(!plus\) return json\(\{ error: BUSY_MESSAGES\.ban, code: 'ban' \}, 503\)/);
  });
});
