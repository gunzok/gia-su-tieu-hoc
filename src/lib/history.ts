import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GradingResult, Subject } from '@/lib/grading';

export type HistoryEntry = GradingResult & {
  id: string;
  createdAt: string;
  subject: Subject;
  grade: number;
};

const STORAGE_KEY = 'lich-su-cham-bai';
const MAX_ENTRIES = 200;

export async function loadHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
}

export async function addHistoryEntry(entry: HistoryEntry) {
  const history = await loadHistory();
  const next = [entry, ...history].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
