// Phần dùng chung của hàm "doc-loi": danh sách dịch vụ giọng đọc và thứ tự thử.
// Không gọi mạng ở đây để test được bằng jest.

export type VoiceProvider = 'google' | 'elevenlabs';
export type TeacherVoice = 'co' | 'thay';

export type ProviderConfig = {
  provider: VoiceProvider;
  // Tên giọng (Google) hoặc mã giọng (ElevenLabs) cho cô và thầy.
  voices: Record<TeacherVoice, string>;
  speakingRate: number;
  monthlyLimit: number;
};

type Env = (name: string) => string | undefined;

function limit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Các dịch vụ có khoá, theo thứ tự thử: Google trước (1 triệu ký tự miễn phí/tháng),
 * ElevenLabs sau làm dự phòng. Dịch vụ nào chưa có khoá thì bỏ qua.
 */
export function voiceProviders(env: Env): ProviderConfig[] {
  const list: ProviderConfig[] = [];
  if (env('GOOGLE_TTS_API_KEY')) {
    list.push({
      provider: 'google',
      voices: { co: 'vi-VN-Chirp3-HD-Aoede', thay: 'vi-VN-Chirp3-HD-Charon' },
      speakingRate: 0.95,
      // Dừng sớm hơn 1 triệu một chút vì Google đếm có thể lệch ít so với mình.
      monthlyLimit: limit(env('GOOGLE_TTS_MONTHLY_CHARS'), 900_000),
    });
  }
  if (env('ELEVENLABS_API_KEY')) {
    list.push({
      provider: 'elevenlabs',
      // Giọng có sẵn của ElevenLabs (Sarah, George); đổi bằng secret nếu muốn giọng khác.
      voices: {
        co: env('ELEVENLABS_VOICE_CO') || 'EXAVITQu4vr4xnSDxMaL',
        thay: env('ELEVENLABS_VOICE_THAY') || 'JBFqnCBsd6RMkjVDRZzb',
      },
      speakingRate: 0.95,
      // Gói miễn phí ElevenLabs nhỏ (khoảng 10 nghìn credit/tháng); đặt mức thấp để không tốn tiền bất ngờ.
      monthlyLimit: limit(env('ELEVENLABS_MONTHLY_CHARS'), 10_000),
    });
  }
  return list;
}

/** Khoá dòng đếm ký tự trong bảng giong_doc_thang. Google giữ dạng cũ '2026-10' để không mất số đã đếm. */
export function usageKey(provider: VoiceProvider, month: string) {
  return provider === 'google' ? month : `${provider}:${month}`;
}

/** Đường dẫn file âm thanh trong kho giong-doc (mỗi dịch vụ, mỗi giọng một thư mục). */
export function audioPath(config: ProviderConfig, voice: string, hash: string) {
  return config.provider === 'google' ? `${voice}/${hash}.mp3` : `${config.provider}/${voice}/${hash}.mp3`;
}

/**
 * ElevenLabs báo tài khoản đã hết credit (vd khi credit dùng cho việc khác ngoài app).
 * Lỗi dạng: 401 {"detail":{"status":"quota_exceeded",...}}.
 */
export function isQuotaExceeded(provider: VoiceProvider, status: number, body: string) {
  if (provider !== 'elevenlabs') return false;
  if (status !== 401 && status !== 402 && status !== 429) return false;
  return /quota_exceeded|insufficient_credits|exceeds your quota/i.test(body);
}
