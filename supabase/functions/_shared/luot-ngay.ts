// Đếm lượt dùng AI mỗi ngày (giờ Việt Nam) trong bảng ai_usage_log, cho "Hỏi cô" và giọng đọc.
// Chấm bài có bảng riêng grading_usage (đếm theo trang).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const vietnamOffsetMs = 7 * 60 * 60 * 1000;

export function startOfTodayInVietnam() {
  const vietnamNow = new Date(Date.now() + vietnamOffsetMs);
  vietnamNow.setUTCHours(0, 0, 0, 0);
  return new Date(vietnamNow.getTime() - vietnamOffsetMs);
}

/**
 * Ghi một lượt rồi đếm số lượt hôm nay (kể cả lượt này), để hai yêu cầu cùng lúc không lọt quá giới hạn.
 * Trả null khi lỗi máy chủ.
 */
export async function recordUsage(admin: SupabaseClient, userId: string, kind: 'hoi-co' | 'doc-loi') {
  const inserted = await admin.from('ai_usage_log').insert({ owner_id: userId, kind }).select('id').single();
  if (inserted.error || !inserted.data) {
    console.error('Lỗi ghi lượt dùng AI:', inserted.error);
    return null;
  }
  const counted = await admin
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('kind', kind)
    .gte('created_at', startOfTodayInVietnam().toISOString());
  if (counted.error || counted.count === null) {
    console.error('Lỗi đếm lượt dùng AI:', counted.error);
    await admin.from('ai_usage_log').delete().eq('id', inserted.data.id);
    return null;
  }
  const id = inserted.data.id as number;
  return { count: counted.count, refund: () => admin.from('ai_usage_log').delete().eq('id', id) };
}
