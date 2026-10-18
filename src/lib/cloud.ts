import type { HistoryEntry } from '@/lib/history';
import type { ChildProfile } from '@/lib/profile';
import { currentUserId, supabase } from '@/lib/supabase';

// Đồng bộ hồ sơ bé và lịch sử chấm bài với Supabase (bảng children, gradings).
// Mọi hàm đều tự bỏ qua khi chưa cấu hình Supabase hoặc chưa đăng nhập.

type GradingRow = {
  local_id: string;
  subject: HistoryEntry['subject'];
  grade: number;
  score: number;
  spoken_feedback: string;
  parent_note: string;
  items: HistoryEntry['items'];
  created_at: string;
  image_paths: string[];
  engine: HistoryEntry['engine'] | null;
  child_id?: string | null;
};

const gradingColumns =
  'local_id, subject, grade, score, spoken_feedback, parent_note, items, created_at, image_paths, engine, child_id';

// Bé của tài khoản này (hiện mỗi tài khoản một bé); nhớ lại để khỏi hỏi máy chủ mỗi lần.
let cachedChildId: { userId: string; childId: string | null } | null = null;

async function childIdFor(userId: string) {
  if (cachedChildId?.userId === userId && cachedChildId.childId) return cachedChildId.childId;
  const { data } = await supabase!.from('children').select('id').maybeSingle();
  cachedChildId = { userId, childId: data?.id ?? null };
  return cachedChildId.childId;
}

function toRow(entry: HistoryEntry): GradingRow {
  return {
    local_id: entry.id,
    subject: entry.subject,
    grade: entry.grade,
    score: entry.score,
    spoken_feedback: entry.spokenFeedback,
    parent_note: entry.parentNote,
    items: entry.items,
    created_at: entry.createdAt,
    image_paths: entry.imagePaths ?? [],
    engine: entry.engine ?? null,
  };
}

function fromRow(row: GradingRow): HistoryEntry {
  return {
    id: row.local_id,
    subject: row.subject,
    grade: row.grade,
    score: Number(row.score),
    spokenFeedback: row.spoken_feedback,
    parentNote: row.parent_note,
    items: row.items,
    createdAt: row.created_at,
    imagePaths: row.image_paths ?? [],
    engine: row.engine ?? undefined,
    childId: row.child_id ?? undefined,
  };
}

export async function pushProfile(profile: ChildProfile) {
  if (!supabase || !(await currentUserId())) return;
  const { error } = await supabase
    .from('children')
    .upsert(
      {
        name: profile.name,
        grade: profile.grade,
        avatar: profile.avatar,
        teacher: profile.teacher ?? 'co',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' },
    );
  if (error) throw error;
}

export async function pullProfile(): Promise<ChildProfile | null> {
  if (!supabase || !(await currentUserId())) return null;
  const { data, error } = await supabase.from('children').select('name, grade, avatar, teacher').maybeSingle();
  if (error) throw error;
  return data;
}

export async function pushGradings(entries: HistoryEntry[]) {
  const userId = await currentUserId();
  if (!supabase || entries.length === 0 || !userId) return;
  const childId = await childIdFor(userId);
  const { error } = await supabase
    .from('gradings')
    .upsert(
      entries.map((entry) => ({ ...toRow(entry), child_id: childId })),
      { onConflict: 'owner_id,local_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Gắn ảnh các trang (đã tải lên kho) vào bài chấm trên máy chủ. */
export async function setGradingImages(localId: string, imagePaths: string[]) {
  if (!supabase || !(await currentUserId())) return;
  const { error } = await supabase.from('gradings').update({ image_paths: imagePaths }).eq('local_id', localId);
  if (error) throw error;
}

/** null nghĩa là không lấy được từ máy chủ (chưa đăng nhập, mất mạng…), dùng bản trên máy. */
export async function pullGradings(limit: number): Promise<HistoryEntry[] | null> {
  if (!supabase || !(await currentUserId())) return null;
  const { data, error } = await supabase
    .from('gradings')
    .select(gradingColumns)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as GradingRow[]).map(fromRow);
}

export async function deleteAllGradings() {
  const userId = await currentUserId();
  if (!supabase || !userId) return;
  const { error } = await supabase.from('gradings').delete().eq('owner_id', userId);
  if (error) throw error;
}
