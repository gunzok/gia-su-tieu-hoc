import { naturalSpeech } from '@/lib/speech';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(async () => []),
  VoiceQuality: { Enhanced: 'Enhanced', Default: 'Default' },
}));
jest.mock('@/lib/supabase', () => ({ supabase: null, ensureSession: jest.fn() }));
jest.mock('@/lib/payments', () => ({ getPremiumStatus: jest.fn(async () => ({ isPremium: false })) }));

describe('naturalSpeech', () => {
  it('"a)" đọc thành "a,"', () => {
    expect(naturalSpeech('a) 5 + 3 = 8')).toBe('a, 5 + 3 = 8.');
    expect(naturalSpeech('Câu a) và câu b) đúng.')).toBe('Câu a, và câu b, đúng.');
  });

  it('"1/2" đọc thành "1 phần 2"', () => {
    expect(naturalSpeech('Tô màu 1/2 hình tròn.')).toBe('Tô màu 1 phần 2 hình tròn.');
    expect(naturalSpeech('3 / 4 cái bánh')).toBe('3 phần 4 cái bánh.');
  });

  it('xuống dòng thành chỗ ngắt câu', () => {
    expect(naturalSpeech('Con làm đúng\nGiỏi lắm!')).toBe('Con làm đúng. Giỏi lắm!');
    expect(naturalSpeech('Câu một,\n\nCâu hai')).toBe('Câu một, Câu hai.');
  });

  it('bỏ emoji, ký hiệu và dấu ngoặc kép', () => {
    expect(naturalSpeech('**Giỏi quá** 🎉')).toBe('Giỏi quá.');
    expect(naturalSpeech('Con viết "mười bốn" nhé.')).toBe('Con viết mười bốn nhé.');
  });

  it('mũi tên thành dấu phẩy', () => {
    expect(naturalSpeech('3 + 5 → 8')).toBe('3 + 5, 8.');
  });

  it('chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    expect(naturalSpeech('')).toBe('');
    expect(naturalSpeech('  \n  ')).toBe('');
  });
});
