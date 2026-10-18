import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteAllGradings, pullGradings, pushGradings, setGradingImages } from '@/lib/cloud';
import type { GradingEngine, GradingResult, Subject } from '@/lib/grading';
import { deleteAllLocalPages, deleteLocalPages, deleteRemotePages, uploadPages } from '@/lib/page-images';

export type HistoryEntry = GradingResult & {
  id: string;
  createdAt: string;
  subject: Subject;
  grade: number;
  /** Ảnh các trang trên máy này (file:// …), theo thứ tự trang. */
  pages?: string[];
  /** Ảnh các trang trong kho Supabase "bai-lam". */
  imagePaths?: string[];
  engine?: GradingEngine;
  childId?: string;
};

const STORAGE_KEY = 'lich-su-cham-bai';
const MAX_ENTRIES = 200;

async function loadLocal(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
}

async function saveLocal(entries: HistoryEntry[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

async function updateLocal(id: string, patch: Partial<HistoryEntry>) {
  const local = await loadLocal();
  await saveLocal(local.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
}

/** Bài có ảnh trên máy nhưng chưa có trong kho thì tải lên (lúc chấm bị mất mạng). */
async function uploadMissingPages(entry: HistoryEntry) {
  if (!entry.pages?.length || entry.imagePaths?.length) return;
  const paths = await uploadPages(entry.id, entry.pages);
  if (!paths) return;
  await setGradingImages(entry.id, paths);
  await updateLocal(entry.id, { imagePaths: paths });
}

/**
 * Lịch sử chấm bài: luôn có bản trên máy. Nếu đã đăng nhập Supabase thì gộp với bản trên
 * máy chủ, đẩy lên những bài (và ảnh) chấm lúc mất mạng, rồi lưu lại bản gộp vào máy.
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  const local = await loadLocal();
  try {
    const remote = await pullGradings(MAX_ENTRIES);
    if (!remote) return local;

    const localById = new Map(local.map((entry) => [entry.id, entry]));
    const remoteIds = new Set(remote.map((entry) => entry.id));
    const localOnly = local.filter((entry) => !remoteIds.has(entry.id));
    await pushGradings(localOnly);

    // Bản trên máy chủ là chính, giữ thêm đường dẫn ảnh trên máy (máy chủ không biết).
    const merged = [
      ...remote.map((entry) => ({ ...entry, pages: localById.get(entry.id)?.pages })),
      ...localOnly,
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await saveLocal(merged);

    for (const entry of merged) {
      uploadMissingPages(entry).catch((error) => console.warn('Chưa tải ảnh bài làm lên được:', error));
    }
    return merged.slice(0, MAX_ENTRIES);
  } catch (error) {
    console.warn('Chưa đồng bộ được lịch sử với máy chủ:', error);
    return local;
  }
}

export async function addHistoryEntry(entry: HistoryEntry) {
  const local = await loadLocal();
  await saveLocal([entry, ...local]);
  // Lỗi mạng thì thôi; lần mở lịch sử sau sẽ tự đẩy bài và ảnh lên lại.
  pushGradings([entry])
    .then(() => uploadMissingPages(entry))
    .catch((error) => console.warn('Chưa lưu được bài chấm lên máy chủ:', error));
}

/** Chỉ xoá lịch sử và ảnh trên máy này (dùng sau khi đã xoá tài khoản trên máy chủ). */
export async function clearLocalHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  deleteAllLocalPages();
}

export async function clearHistory() {
  const local = await loadLocal();
  await AsyncStorage.removeItem(STORAGE_KEY);
  for (const entry of local) deleteLocalPages(entry.id);
  await deleteRemotePages(local.flatMap((entry) => entry.imagePaths ?? []));
  await deleteAllGradings();
}

export async function findHistoryEntry(id: string) {
  return (await loadLocal()).find((entry) => entry.id === id) ?? null;
}
