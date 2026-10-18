// Supabase Edge Function "doc-loi": đổi lời của cô/thầy thành giọng đọc AI tự nhiên (Google Chirp 3 HD).
// Khoá Google chỉ nằm ở đây (Supabase secret GOOGLE_TTS_API_KEY), không nằm trong app.
// Âm thanh được lưu vào kho "giong-doc": câu nào đã đọc rồi thì lần sau trả lại file cũ, không tốn tiền.
//
// Triển khai:  npx supabase functions deploy doc-loi
// Đặt khoá:    npx supabase secrets set GOOGLE_TTS_API_KEY=...

import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'giong-doc';
// Lời dài nhất một lần đọc (khoảng 1 lời nhận xét dài); chặn để tránh lạm dụng.
const maxChars = 1500;
// Link phát âm thanh hết hạn sau 1 giờ.
const urlSeconds = 60 * 60;

// Giọng Google Chirp 3 HD cho từng gia sư. Đổi tên giọng ở đây rồi triển khai lại là xong;
// danh sách giọng: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
const voices = {
  co: { name: 'vi-VN-Chirp3-HD-Aoede', speakingRate: 0.95 },
  thay: { name: 'vi-VN-Chirp3-HD-Charon', speakingRate: 0.95 },
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);

  const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
  if (!apiKey) return json({ error: 'Chưa cài giọng đọc AI' }, 503);

  let body: { text?: unknown; teacher?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không đúng' }, 400);
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > maxChars) return json({ error: 'Lời đọc trống hoặc quá dài' }, 400);
  const voice = voices[body.teacher === 'thay' ? 'thay' : 'co'];

  // Kho dùng chung nên ghi bằng khoá service role (chỉ có trên máy chủ).
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const path = `${voice.name}/${await sha256(`${voice.speakingRate}|${text}`)}.mp3`;

  const cached = await admin.storage.from(BUCKET).createSignedUrl(path, urlSeconds);
  if (cached.data?.signedUrl) return json({ url: cached.data.signedUrl, cached: true });

  try {
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      // Gửi khoá qua header, không để trong đường link (tránh lộ trong nhật ký).
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'vi-VN', name: voice.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: voice.speakingRate },
      }),
    });
    if (!response.ok) {
      console.error('Google TTS lỗi', response.status, await response.text());
      return json({ error: 'Chưa tạo được giọng đọc' }, 502);
    }
    const { audioContent } = (await response.json()) as { audioContent?: string };
    if (!audioContent) return json({ error: 'Chưa tạo được giọng đọc' }, 502);

    const upload = await admin.storage
      .from(BUCKET)
      .upload(path, base64ToBytes(audioContent), { contentType: 'audio/mpeg', upsert: true });
    if (upload.error) throw upload.error;

    const signed = await admin.storage.from(BUCKET).createSignedUrl(path, urlSeconds);
    if (!signed.data?.signedUrl) throw signed.error ?? new Error('Không tạo được link âm thanh');
    return json({ url: signed.data.signedUrl, cached: false });
  } catch (error) {
    console.error('Lỗi tạo giọng đọc:', error);
    return json({ error: 'Chưa tạo được giọng đọc' }, 502);
  }
});
