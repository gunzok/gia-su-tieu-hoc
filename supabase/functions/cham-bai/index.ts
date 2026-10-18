// Supabase Edge Function "cham-bai": nhận ảnh bài làm từ app, gọi Claude để chấm.
// Claude API key chỉ nằm ở đây (Supabase secret ANTHROPIC_API_KEY), không nằm trong app.
//
// Triển khai:  npx supabase functions deploy cham-bai
// Đặt key:     npx supabase secrets set ANTHROPIC_API_KEY=...
//              npx supabase secrets set REVENUECAT_SECRET_KEY=...  (để biết ai có gói Plus)

import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { resultSchema, systemPrompt, type Subject, type TeacherVoice } from '../_shared/cham-bai.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const subjects: Subject[] = ['toan', 'tieng-viet'];
// Ảnh đã được app thu nhỏ còn khoảng vài trăm KB; chặn ảnh quá lớn để tránh lạm dụng.
const maxImageBase64Length = 6_000_000;
// Số trang tối đa mỗi lần chấm (khớp MAX_PAGES trong app).
const maxPages = 6;

// Số lần chấm bằng Claude mỗi ngày (tính theo giờ Việt Nam), đếm trong bảng grading_usage.
const freeDailyLimit = 3;
const plusDailyLimit = 50;
// Entitlement gói Plus; phải trùng PRO_ENTITLEMENT trong src/lib/payments.tsx.
const proEntitlement = 'gia_sư_tiểu_học_pro';
const vietnamOffsetMs = 7 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function startOfTodayInVietnam() {
  const vietnamNow = new Date(Date.now() + vietnamOffsetMs);
  vietnamNow.setUTCHours(0, 0, 0, 0);
  return new Date(vietnamNow.getTime() - vietnamOffsetMs);
}

// Hỏi RevenueCat xem tài khoản có gói Plus không (app đã gắn RevenueCat với id Supabase).
// Chưa đặt REVENUECAT_SECRET_KEY hoặc RevenueCat lỗi thì tính là gói Miễn phí.
async function hasPlus(userId: string) {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!secretKey) return false;
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      console.error('RevenueCat trả lỗi', response.status, await response.text());
      return false;
    }
    const data = await response.json();
    const entitlement = data?.subscriber?.entitlements?.[proEntitlement];
    if (!entitlement) return false;
    // Gói trọn đời không có ngày hết hạn.
    return entitlement.expires_date == null || new Date(entitlement.expires_date).getTime() > Date.now();
  } catch (error) {
    console.error('Lỗi gọi RevenueCat:', error);
    return false;
  }
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

  // Ghi lượt trước rồi mới đếm, để hai lần gửi cùng lúc không lọt quá giới hạn.
  const userId = userData.user.id;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: usage, error: usageError } = await admin
    .from('grading_usage')
    .insert({ owner_id: userId, pages: images.length })
    .select('id')
    .single();
  if (usageError || !usage) {
    console.error('Lỗi ghi lượt chấm:', usageError);
    return json({ error: 'Máy chủ chưa chấm được bài' }, 500);
  }
  const refundUsage = () => admin.from('grading_usage').delete().eq('id', usage.id);

  const { count, error: countError } = await admin
    .from('grading_usage')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .gte('created_at', startOfTodayInVietnam().toISOString());
  if (countError || count === null) {
    console.error('Lỗi đếm lượt chấm:', countError);
    await refundUsage();
    return json({ error: 'Máy chủ chưa chấm được bài' }, 500);
  }
  // Chỉ hỏi RevenueCat khi đã dùng hết lượt miễn phí.
  if (count > freeDailyLimit) {
    const plus = await hasPlus(userId);
    const limit = plus ? plusDailyLimit : freeDailyLimit;
    if (count > limit) {
      await refundUsage();
      return json(
        {
          error: plus
            ? `Hôm nay con đã chấm ${limit} bài rồi, giỏi quá! Con nghỉ ngơi, mai mình chấm tiếp nhé.`
            : `Hôm nay con đã chấm đủ ${limit} bài rồi. Mai con chấm tiếp nhé! Ba mẹ có thể mở gói Plus để chấm nhiều bài hơn.`,
          code: 'het-luot',
          limit,
          plus,
        },
        429,
      );
    }
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
    // Chưa chấm được thì trả lại lượt cho bé.
    await refundUsage();
    return json({ error: 'Máy chủ chưa chấm được bài' }, 502);
  }
});
