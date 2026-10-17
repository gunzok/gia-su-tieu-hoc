import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SubjectNames } from '@/lib/grading';
import { clearHistory, loadHistory, type HistoryEntry } from '@/lib/history';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ParentScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  const average =
    history.length > 0 ? history.reduce((sum, entry) => sum + entry.score, 0) / history.length : null;

  function confirmClear() {
    Alert.alert('Xoá lịch sử?', 'Toàn bộ kết quả chấm bài đã lưu trên máy sẽ bị xoá.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={history}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">Dành cho bố mẹ</ThemedText>
              {average !== null && (
                <ThemedText themeColor="textSecondary">
                  {history.length} bài đã chấm · điểm trung bình {average.toFixed(1)}/10
                </ThemedText>
              )}
            </View>
          }
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">
              Chưa có bài nào được chấm. Kết quả sẽ hiện ở đây sau khi bé chụp bài.
            </ThemedText>
          }
          renderItem={({ item }) => <HistoryCard entry={item} />}
          ListFooterComponent={
            history.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={confirmClear} style={styles.clear}>
                <ThemedText type="small" style={{ color: Accent.wrong }}>
                  Xoá lịch sử
                </ThemedText>
              </Pressable>
            ) : undefined
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const wrongItems = entry.items.filter((item) => !item.correct);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <ThemedText type="smallBold">
            {SubjectNames[entry.subject]} · Lớp {entry.grade}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(entry.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.score}>{entry.score}/10</ThemedText>
      </View>

      <ThemedText>{entry.parentNote}</ThemedText>

      {wrongItems.length > 0 && (
        <View style={styles.wrongList}>
          <ThemedText type="smallBold">Câu bé làm sai ({wrongItems.length}):</ThemedText>
          {wrongItems.map((item, index) => (
            <ThemedText key={index} type="small" themeColor="textSecondary">
              • {item.question}: {item.explanation}
            </ThemedText>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 800,
    color: Accent.primary,
  },
  wrongList: {
    gap: Spacing.half,
  },
  clear: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
});
