// GIA-87 (đề xuất từ GIA-74): bản web không đọc bằng giọng tiếng Anh khi trình duyệt thiếu giọng vi-VN.
import { resetBrowserVoicesCache } from '@/lib/browser-voices';
import { speakVietnamese, stopSpeaking } from '@/lib/speech.web';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }));
// Không có Supabase: giọng AI của máy chủ lỗi, chuyển sang giọng trình duyệt.
jest.mock('@/lib/supabase', () => ({ supabase: null, ensureSession: jest.fn() }));
jest.mock('@/lib/payments', () => ({ getPremiumStatus: jest.fn(async () => ({ isPremium: false })) }));

type Voice = { lang: string; name: string };

class FakeUtterance {
  text: string;
  voice: Voice | null = null;
  lang = '';
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

let spoken: FakeUtterance[];
const cancel = jest.fn();

function mockBrowser(voices: Voice[] | undefined) {
  spoken = [];
  const synth =
    voices === undefined
      ? undefined
      : {
          getVoices: () => voices,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          speak: (utterance: FakeUtterance) => spoken.push(utterance),
          cancel,
        };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
}

beforeEach(() => {
  resetBrowserVoicesCache();
  cancel.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('speech.web: đọc bằng giọng trình duyệt', () => {
  it('có giọng vi-VN: đọc bằng đúng giọng tiếng Việt, không phải giọng mặc định', async () => {
    mockBrowser([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'vi-VN', name: 'Linh' },
    ]);
    const onDone = jest.fn();
    const onNoVoice = jest.fn();
    await speakVietnamese('Con làm đúng rồi', { onDone, onNoVoice });

    expect(spoken).toHaveLength(1);
    expect(spoken[0].voice?.name).toBe('Linh');
    expect(spoken[0].lang).toBe('vi-VN');
    expect(spoken[0].text).toBe('Con làm đúng rồi.');
    expect(onNoVoice).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();

    spoken[0].onend?.();
    spoken[0].onerror?.();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('thầy dùng giọng tiếng Việt thứ hai nếu có', async () => {
    mockBrowser([
      { lang: 'vi-VN', name: 'Linh' },
      { lang: 'vi_VN', name: 'Nam' },
    ]);
    await speakVietnamese('Chào con', undefined, 'thay');
    expect(spoken[0].voice?.name).toBe('Nam');
    expect(spoken[0].pitch).toBeLessThan(1);
  });

  it('không có giọng vi-VN: không đọc bằng giọng tiếng Anh, báo nhẹ và nhả nút loa', async () => {
    mockBrowser([{ lang: 'en-US', name: 'Samantha' }]);
    const onDone = jest.fn();
    const onNoVoice = jest.fn();
    await speakVietnamese('Con làm đúng rồi', { onDone, onNoVoice });

    expect(spoken).toHaveLength(0);
    expect(onNoVoice).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('trình duyệt không có Web Speech: không lỗi, báo nhẹ', async () => {
    mockBrowser(undefined);
    const onDone = jest.fn();
    const onNoVoice = jest.fn();
    await expect(speakVietnamese('Chào con', { onDone, onNoVoice })).resolves.toBeUndefined();
    expect(onNoVoice).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(() => stopSpeaking()).not.toThrow();
  });

  it('chữ rỗng: không đọc, không báo thiếu giọng', async () => {
    mockBrowser([{ lang: 'en-US', name: 'Samantha' }]);
    const onDone = jest.fn();
    const onNoVoice = jest.fn();
    await speakVietnamese('  🎉 ', { onDone, onNoVoice });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onNoVoice).not.toHaveBeenCalled();
  });

  it('bấm dừng thì huỷ giọng trình duyệt', () => {
    mockBrowser([{ lang: 'vi-VN', name: 'Linh' }]);
    stopSpeaking();
    expect(cancel).toHaveBeenCalled();
  });
});
