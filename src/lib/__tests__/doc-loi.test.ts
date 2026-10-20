import { audioPath, usageKey, voiceProviders } from '../../../supabase/functions/_shared/doc-loi';

const envOf = (values: Record<string, string>) => (name: string) => values[name];

describe('voiceProviders', () => {
  it('thử Google trước, ElevenLabs sau', () => {
    const list = voiceProviders(envOf({ GOOGLE_TTS_API_KEY: 'g', ELEVENLABS_API_KEY: 'e' }));
    expect(list.map((p) => p.provider)).toEqual(['google', 'elevenlabs']);
  });

  it('bỏ qua dịch vụ chưa có khoá', () => {
    expect(voiceProviders(envOf({ ELEVENLABS_API_KEY: 'e' })).map((p) => p.provider)).toEqual(['elevenlabs']);
    expect(voiceProviders(envOf({}))).toEqual([]);
  });

  it('mức tháng mặc định và đổi được bằng secret', () => {
    const [google, eleven] = voiceProviders(envOf({ GOOGLE_TTS_API_KEY: 'g', ELEVENLABS_API_KEY: 'e' }));
    expect(google.monthlyLimit).toBe(900_000);
    expect(eleven.monthlyLimit).toBe(10_000);
    const [custom] = voiceProviders(envOf({ ELEVENLABS_API_KEY: 'e', ELEVENLABS_MONTHLY_CHARS: '50000' }));
    expect(custom.monthlyLimit).toBe(50_000);
  });

  it('mức tháng sai thì dùng mặc định', () => {
    const [google] = voiceProviders(envOf({ GOOGLE_TTS_API_KEY: 'g', GOOGLE_TTS_MONTHLY_CHARS: 'abc' }));
    expect(google.monthlyLimit).toBe(900_000);
  });

  it('đổi giọng ElevenLabs bằng secret', () => {
    const [eleven] = voiceProviders(envOf({ ELEVENLABS_API_KEY: 'e', ELEVENLABS_VOICE_CO: 'giong-co' }));
    expect(eleven.voices.co).toBe('giong-co');
    expect(eleven.voices.thay).toBeTruthy();
  });
});

describe('usageKey và audioPath', () => {
  it('Google giữ khoá đếm và đường dẫn cũ để không mất số đếm, file đã lưu', () => {
    const [google, eleven] = voiceProviders(envOf({ GOOGLE_TTS_API_KEY: 'g', ELEVENLABS_API_KEY: 'e' }));
    expect(usageKey('google', '2026-10')).toBe('2026-10');
    expect(usageKey('elevenlabs', '2026-10')).toBe('elevenlabs:2026-10');
    expect(audioPath(google, 'vi-VN-Chirp3-HD-Aoede', 'abc')).toBe('vi-VN-Chirp3-HD-Aoede/abc.mp3');
    expect(audioPath(eleven, 'v1', 'abc')).toBe('elevenlabs/v1/abc.mp3');
  });
});
