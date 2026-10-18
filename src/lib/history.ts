import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteAllGradings, pullGradings, pushGradings } from '@/lib/cloud';
import type { GradingResult, Subject } from '@/lib/grading';

export type HistoryEntry = GradingResult & {
  id: string;
  createdAt: string;
  subject: Subject;
  grade: number;
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

/**
 * Lịch sử chấm bài: luôn có bản trên máy. Nếu đã đăng nhập Supabase thì gộp với bản trên
 * máy chủ, đẩy lên những bài chấm lúc mất mạng, rồi lưu lại bản gộp vào máy.
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  const local = await loadLocal();
  try {
    const remote = await pullGradings(MAX_ENTRIES);
    if (!remote) return local;

    const remoteIds = new Set(remote.map((entry) => entry.id));
    const localOnly = local.filter((entry) => !remoteIds.has(entry.id));
    await pushGradings(localOnly);

    const merged = [...remote, ...localOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await saveLocal(merged);
    return merged.slice(0, MAX_ENTRIES);
  } catch (error) {
    console.warn('Chưa đồng bộ được lịch sử với máy chủ:', error);
    return local;
  }
}

export async function addHistoryEntry(entry: HistoryEntry) {
  const local = await loadLocal();
  await saveLocal([entry, ...local]);
  // Lỗi mạng thì thôi; lần mở lịch sử sau sẽ tự đẩy lên lại.
  pushGradings([entry]).catch((error) => console.warn('Chưa lưu được bài chấm lên máy chủ:', error));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await deleteAllGradings();
}
