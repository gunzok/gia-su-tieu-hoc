// GIA-74: Hỏi cô trên web báo nhẹ khi trình duyệt không có giọng tiếng Việt, và nút loa không kẹt.
import { resetVoiceSupportCache, speakTimeoutMs, vietnameseVoiceSupport } from '@/web/web-voice';

type Voice = { lang: string };

function mockSpeech(voices: Voice[] | (() => Voice[]) | undefined) {
  const listeners: (() => void)[] = [];
  const synth =
    voices === undefined
      ? undefined
      : {
          getVoices: typeof voices === 'function' ? voices : () => voices,
          addEventListener: (_: string, listener: () => void) => listeners.push(listener),
          removeEventListener: jest.fn(),
        };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  return { fireVoicesChanged: () => listeners.forEach((listener) => listener()) };
}

beforeEach(() => {
  resetVoiceSupportCache();
  jest.useRealTimers();
});

describe('kiểm giọng tiếng Việt của trình duyệt', () => {
  it('có giọng vi-VN', async () => {
    mockSpeech([{ lang: 'en-US' }, { lang: 'vi-VN' }]);
    await expect(vietnameseVoiceSupport()).resolves.toBe('co');
  });

  it('nhận cả kiểu viết vi_VN', async () => {
    mockSpeech([{ lang: 'vi_VN' }]);
    await expect(vietnameseVoiceSupport()).resolves.toBe('co');
  });

  it('không có giọng tiếng Việt', async () => {
    mockSpeech([{ lang: 'en-US' }]);
    await expect(vietnameseVoiceSupport()).resolves.toBe('khong');
  });

  it('trình duyệt không có Web Speech', async () => {
    mockSpeech(undefined);
    await expect(vietnameseVoiceSupport()).resolves.toBe('khong-ho-tro');
  });

  it('chờ danh sách giọng nạp xong (voiceschanged)', async () => {
    let voices: Voice[] = [];
    const speech = mockSpeech(() => voices);
    const result = vietnameseVoiceSupport();
    voices = [{ lang: 'vi-VN' }];
    speech.fireVoicesChanged();
    await expect(result).resolves.toBe('co');
  });

  it('không treo khi trình duyệt không bao giờ báo danh sách giọng', async () => {
    jest.useFakeTimers();
    mockSpeech([]);
    const result = vietnameseVoiceSupport();
    jest.advanceTimersByTime(2000);
    await expect(result).resolves.toBe('khong');
  });
});

describe('thời gian chờ đọc xong', () => {
  it('câu dài chờ lâu hơn câu ngắn, luôn có giới hạn', () => {
    expect(speakTimeoutMs('Dạ')).toBeGreaterThanOrEqual(15_000);
    expect(speakTimeoutMs('a'.repeat(400))).toBeGreaterThan(speakTimeoutMs('a'.repeat(40)));
    expect(speakTimeoutMs('a'.repeat(400))).toBeLessThan(60_000);
  });
});
