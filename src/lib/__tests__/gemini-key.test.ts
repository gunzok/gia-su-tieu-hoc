import { geminiKeyFor, readGeminiKeys } from '../../../supabase/functions/_shared/gemini-key';

describe('geminiKeyFor (GIA-77): chọn khoá Gemini theo gói', () => {
  const both = { free: 'khoa-mien-phi', paid: 'khoa-tra-phi' };

  it('gói Plus dùng khoá trả phí', () => {
    expect(geminiKeyFor(true, both)).toEqual({ key: 'khoa-tra-phi', tier: 'paid' });
  });

  it('gói miễn phí dùng khoá miễn phí dù đã có khoá trả phí', () => {
    expect(geminiKeyFor(false, both)).toEqual({ key: 'khoa-mien-phi', tier: 'free' });
  });

  it('Plus mà chưa đặt khoá trả phí thì rơi về khoá miễn phí', () => {
    expect(geminiKeyFor(true, { free: 'khoa-mien-phi' })).toEqual({ key: 'khoa-mien-phi', tier: 'free' });
    expect(geminiKeyFor(true, { free: 'khoa-mien-phi', paid: '  ' })).toEqual({ key: 'khoa-mien-phi', tier: 'free' });
  });

  it('gói miễn phí không bao giờ dùng khoá trả phí, kể cả khi thiếu khoá miễn phí', () => {
    expect(geminiKeyFor(false, { paid: 'khoa-tra-phi' })).toBeNull();
  });

  it('không có khoá nào thì trả null', () => {
    expect(geminiKeyFor(true, {})).toBeNull();
    expect(geminiKeyFor(false, {})).toBeNull();
  });
});

describe('readGeminiKeys', () => {
  it('đọc hai secret GEMINI_API_KEY và GEMINI_API_KEY_TRA_PHI, bỏ khoảng trắng', () => {
    const env: Record<string, string> = { GEMINI_API_KEY: ' a ', GEMINI_API_KEY_TRA_PHI: 'b\n' };
    expect(readGeminiKeys((name) => env[name])).toEqual({ free: 'a', paid: 'b' });
  });

  it('secret trống thì coi như chưa đặt', () => {
    expect(readGeminiKeys(() => '')).toEqual({ free: undefined, paid: undefined });
  });
});
