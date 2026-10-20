// Supabase Edge Function "doc-loi": đổi lời của cô/thầy thành giọng đọc AI tự nhiên.
// Thứ tự: Google Chirp 3 HD → ElevenLabs (dự phòng khi Google lỗi hoặc hết lượt tháng) → báo app
// đọc bằng giọng trên máy. Khoá chỉ nằm ở Supabase secret (GOOGLE_TTS_API_KEY, ELEVENLABS_API_KEY).
// Âm thanh được lưu vào kho "giong-doc": câu nào đã đọc rồi thì lần sau trả lại file cũ, không tốn tiền.
//
// Triển khai:  npx supabase functions deploy doc-loi
// Đặt khoá:    npx supabase secrets set GOOGLE_TTS_API_KEY=...  (và ELEVENLABS_API_KEY=...)
// Đổi mức tháng: GOOGLE_TTS_MONTHLY_CHARS (mặc định 900000), ELEVENLABS_MONTHLY_CHARS (mặc định 10000)

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { audioPath, isQuotaExceeded, usageKey, voiceProviders, type ProviderConfig, type TeacherVoice } from '../_shared/doc-loi.ts';

const BUCKET = 'giong-doc';
// Lời dài nhất một lần đọc (khoảng 1 lời nhận xét dài); chặn để tránh lạm dụng.
const maxChars = 1500;
// Link phát âm thanh hết hạn sau 1 giờ.
const urlSeconds = 60 * 60;

// Cho phép bản web của app (chạy trên trình duyệt) gọi hàm này.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Gọi dịch vụ, trả về file MP3; lỗi thì trả null, dịch vụ báo hết credit thì trả 'het-credit'.
async function synthesize(
  config: ProviderConfig,
  voice: string,
  text: string,
): Promise<Uint8Array | 'het-credit' | null> {
  if (config.provider === 'google') {
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      // Gửi khoá qua header, không để trong đường link (tránh lộ trong nhật ký).
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': Deno.env.get('GOOGLE_TTS_API_KEY')! },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'vi-VN', name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: config.speakingRate },
      }),
    });
    if (!response.ok) {
      console.error('Google TTS lỗi', response.status, await response.text());
      return null;
    }
    const { audioContent } = (await response.json()) as { audioContent?: string };
    return audioContent ? base64ToBytes(audioContent) : null;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')! },
      body: JSON.stringify({
        text,
        // Flash v2.5 có tiếng Việt, nhanh và rẻ hơn các mẫu khác.
        model_id: 'eleven_flash_v2_5',
        language_code: 'vi',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: config.speakingRate },
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    console.error('ElevenLabs lỗi', response.status, detail);
    return isQuotaExceeded(config.provider, response.status, detail) ? 'het-credit' : null;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes.length > 0 ? bytes : null;
}

async function signedUrl(admin: SupabaseClient, path: string) {
  const signed = await admin.storage.from(BUCKET).createSignedUrl(path, urlSeconds);
  return signed.data?.signedUrl ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);

  const providers = voiceProviders((name) => Deno.env.get(name));
  if (providers.length === 0) return json({ error: 'Chưa cài giọng đọc AI' }, 503);

  let body: { text?: unknown; teacher?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không đúng' }, 400);
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > maxChars) return json({ error: 'Lời đọc trống hoặc quá dài' }, 400);
  const teacher: TeacherVoice = body.teacher === 'thay' ? 'thay' : 'co';

  // Kho dùng chung nên ghi bằng khoá service role (chỉ có trên máy chủ).
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const targets = await Promise.all(
    providers.map(async (config) => {
      const voice = config.voices[teacher];
      const hash = await sha256(`${config.speakingRate}|${text}`);
      return { config, voice, path: audioPath(config, voice, hash) };
    }),
  );

  // Câu đã có sẵn trong kho (của dịch vụ nào cũng được): không gọi dịch vụ, không tính lượt.
  for (const target of targets) {
    const cached = await signedUrl(admin, target.path);
    if (cached) return json({ url: cached, cached: true });
  }

  // Đếm theo tháng (giờ UTC), mỗi dịch vụ một dòng trong giong_doc_thang.
  const month = new Date().toISOString().slice(0, 7);
  let anyFailed = false;
  for (const { config, voice, path } of targets) {
    const key = usageKey(config.provider, month);
    const { data: usage, error: usageError } = await admin
      .from('giong_doc_thang')
      .select('so_ky_tu')
      .eq('thang', key)
      .maybeSingle();
    if (usageError) {
      console.error('Không đọc được bộ đếm giọng đọc:', usageError);
      anyFailed = true;
      continue;
    }
    // Gần hết phần cho phép tháng này: chuyển sang dịch vụ tiếp theo.
    if ((usage?.so_ky_tu ?? 0) + text.length > config.monthlyLimit) continue;

    try {
      const audio = await synthesize(config, voice, text);
      if (audio === 'het-credit') {
        // Tài khoản đã hết credit: đẩy bộ đếm lên đủ mức tháng để các câu sau bỏ qua dịch vụ này ngay.
        const filled = await admin.rpc('cong_ky_tu_giong_doc', {
          p_thang: key,
          p_so_ky_tu: Math.max(1, config.monthlyLimit - (usage?.so_ky_tu ?? 0)),
        });
        if (filled.error) console.error('Không cập nhật được bộ đếm giọng đọc:', filled.error);
        continue;
      }
      if (!audio) {
        anyFailed = true;
        continue;
      }
      // Dịch vụ đã tạo xong (đã tính tiền) nên cộng vào bộ đếm ngay, kể cả khi lưu file lỗi.
      const counted = await admin.rpc('cong_ky_tu_giong_doc', { p_thang: key, p_so_ky_tu: text.length });
      if (counted.error) console.error('Không cộng được bộ đếm giọng đọc:', counted.error);

      const upload = await admin.storage
        .from(BUCKET)
        .upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
      if (upload.error) throw upload.error;
      const signed = await signedUrl(admin, path);
      if (!signed) throw new Error('Không tạo được link âm thanh');
      return json({ url: signed, cached: false, provider: config.provider });
    } catch (error) {
      console.error(`Lỗi tạo giọng đọc (${config.provider}):`, error);
      anyFailed = true;
    }
  }

  // Không dịch vụ nào đọc được. Hết lượt cả hai thì báo 429 để app thôi gọi tới khi mở lại.
  if (!anyFailed) return json({ error: 'Đã hết lượt giọng đọc AI tháng này', hetLuot: true }, 429);
  return json({ error: 'Chưa tạo được giọng đọc' }, 502);
});
