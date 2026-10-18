// Supabase Edge Function "cham-bai": nhận ảnh bài làm từ app, gọi Claude để chấm.
// Claude API key chỉ nằm ở đây (Supabase secret ANTHROPIC_API_KEY), không nằm trong app.
//
// Triển khai:  npx supabase functions deploy cham-bai
// Đặt key:     npx supabase secrets set ANTHROPIC_API_KEY=...

import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { resultSchema, systemPrompt, type Subject, type TeacherVoice } from '../_shared/cham-bai.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const subjects: Subject[] = ['toan', 'tieng-viet'];
// Ảnh đã được app thu nhỏ còn khoảng vài trăm KB; chặn ảnh quá lớn để tránh lạm dụng.
const maxImageBase64Length = 6_000_000;
// Số trang tối đa mỗi lần chấm (khớp MAX_PAGES trong app).
const maxPages = 6;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405);

  // Chỉ người dùng đã đăng nhập (kể cả đăng nhập ẩn danh) mới được gọi Claude.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Chưa đăng nhập' }, 401);

  let body: { images?: unknown; imageBase64?: unknown; subject?: unknown; grade?: unknown; teacher?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không đúng' }, 400);
  }
  const { subject, grade } = body;
  // Nhiều trang: images[]; app bản cũ gửi một ảnh imageBase64.
  const images = Array.isArray(body.images) ? body.images : [body.imageBase64];
  // Gói Plus mới chọn được Thầy; máy chủ chưa kiểm tra gói nên chỉ nhận đúng 2 giá trị.
  const teacher: TeacherVoice = body.teacher === 'thay' ? 'thay' : 'co';
  if (
    images.length === 0 ||
    images.length > maxPages ||
    !images.every((image) => typeof image === 'string' && image.length > 0 && image.length <= maxImageBase64Length) ||
    !subjects.includes(subject as Subject) ||
    typeof grade !== 'number' ||
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 5
  ) {
    return json({ error: 'Thiếu ảnh, môn hoặc lớp' }, 400);
  }

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: resultSchema },
      },
      system: systemPrompt(subject as Subject, grade, teacher),
      messages: [
        {
          role: 'user',
          content: [
            ...(images as string[]).map((data) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
            })),
            { type: 'text', text: `${teacher === 'thay' ? 'Thầy' : 'Cô'} chấm bài này giúp con nhé.` },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'AI không chấm được bài này. Con thử chụp lại bài khác nhé.' }, 422);
    }
    if (response.stop_reason === 'max_tokens') {
      return json({ error: 'Bài làm quá dài, AI chưa chấm xong. Con thử chụp ít câu hơn nhé.' }, 422);
    }
    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'AI không trả về kết quả chấm.' }, 502);

    return json(JSON.parse(text.text));
  } catch (error) {
    console.error('Lỗi gọi Claude:', error);
    return json({ error: 'Máy chủ chưa chấm được bài' }, 502);
  }
});
