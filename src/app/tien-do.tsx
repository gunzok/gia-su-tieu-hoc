import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type Subject } from '@/lib/grading';
import { clearHistory, loadHistory, type HistoryEntry } from '@/lib/history';
import { accuracy, allSubjects, averageScore, scoreLabel, SubjectIcons, thisWeek } from '@/lib/progress';

const subjectBarColors: Record<Subject, { bar: string; soft: string; ink: string }> = {
  toan: { bar: Palette.mint, soft: Palette.mintSoft, ink: Palette.mintDark },
  'tieng-viet': { bar: Palette.amber, soft: Palette.amberSoft, ink: Palette.amberInk },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProgressScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  const average = averageScore(history);
  const correctRate = accuracy(history);
  const week = thisWeek(history);

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
    <Screen>
      <AppHeader subtitle="Tiến độ" />

      <View style={styles.titleRow}>
        <View style={styles.titleIcon}>
          <AppText style={styles.titleEmoji}>📊</AppText>
        </View>
        <View>
          <AppText variant="headlineLg">Báo cáo tiến độ</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Dành cho bố mẹ
          </AppText>
        </View>
      </View>

      {history.length === 0 ? (
        <Card style={styles.empty}>
          <Mascot size={96} />
          <AppText variant="bodyLg" color={Palette.inkSoft} style={styles.center}>
            Chưa có bài nào được chấm. Kết quả sẽ hiện ở đây sau khi bé chụp bài.
          </AppText>
        </Card>
      ) : (
        <>
          <View style={styles.section}>
            <AppText variant="headlineSm">Chỉ số nổi bật</AppText>
            <View style={styles.statsRow}>
              <StatCard
                icon="📖"
                value={String(history.length)}
                label="Bài đã chấm"
                tint={Palette.blueSoft}
                ink={Palette.blueDark}
              />
              <StatCard
                icon="⭐"
                value={average === null ? '–' : average.toFixed(1)}
                label="Điểm TB"
                tint={Palette.amberSoft}
                ink={Palette.amberInk}
              />
              <StatCard
                icon="🏆"
                value={correctRate === null ? '–' : `${Math.round(correctRate * 100)}%`}
                label="Câu đúng"
                tint={Palette.mintSoft}
                ink={Palette.mintDark}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="headlineSm">Mức độ thành thạo môn</AppText>
            {allSubjects.map((subject) => {
              const entries = history.filter((entry) => entry.subject === subject);
              const subjectAverage = averageScore(entries);
              const colors = subjectBarColors[subject];
              return (
                <Card key={subject} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={[styles.subjectIcon, { backgroundColor: colors.soft }]}>
                      <AppText style={styles.subjectEmoji}>{SubjectIcons[subject]}</AppText>
                    </View>
                    <AppText variant="labelLg" style={styles.flex}>
                      {SubjectNames[subject]}
                    </AppText>
                    {subjectAverage !== null && (
                      <>
                        <AppText variant="labelLg" color={colors.ink}>
                          {Math.round(subjectAverage * 10)}%
                        </AppText>
                        <View style={[styles.levelTag, { backgroundColor: colors.soft }]}>
                          <AppText variant="labelSm" color={colors.ink}>
                            {scoreLabel(subjectAverage)}
                          </AppText>
                        </View>
                      </>
                    )}
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${(subjectAverage ?? 0) * 10}%`,
                          backgroundColor: colors.bar,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="bodySm" color={Palette.inkSoft}>
                    {entries.length === 0 ? 'Chưa có bài nào' : `${entries.length} bài đã chấm`}
                  </AppText>
                </Card>
              );
            })}
          </View>

          <Card borderColor={Palette.blueSoft}>
            <View style={styles.noteHeader}>
              <Mascot size={48} />
              <View style={styles.flex}>
                <AppText variant="labelLg" color={Palette.blueDark}>
                  Nhận xét mới nhất của cô
                </AppText>
                <AppText variant="bodySm" color={Palette.inkSoft}>
                  {SubjectNames[history[0].subject]} · {formatDate(history[0].createdAt)}
                </AppText>
              </View>
            </View>
            <View style={styles.quote}>
              <AppText variant="bodyMd" color={Palette.blueDark}>
                {history[0].parentNote}
              </AppText>
            </View>
          </Card>

          <Card>
            <AppText variant="labelLg">🗓️ Tuần này bé đã học</AppText>
            <View style={styles.weekRow}>
              {week.map((day) => (
                <View key={day.label} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayBox,
                      day.done
                        ? { backgroundColor: Palette.mint, borderColor: Palette.mintDark }
                        : day.isToday
                          ? { backgroundColor: Palette.amberSoft, borderColor: Palette.amber }
                          : { backgroundColor: Palette.surfaceMuted, borderColor: Palette.border },
                    ]}>
                    <AppText variant="labelMd" color={day.done ? Palette.white : Palette.inkSoft}>
                      {day.done ? '✓' : day.isFuture ? '' : '·'}
                    </AppText>
                  </View>
                  <AppText
                    variant="labelSm"
                    color={day.isToday ? Palette.amberInk : Palette.inkSoft}>
                    {day.label}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.section}>
            <AppText variant="headlineSm">Lịch sử chấm bài</AppText>
            {history.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} />
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={confirmClear} style={styles.clear}>
            <AppText variant="labelMd" color={Palette.coralDark}>
              Xoá lịch sử
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function StatCard(props: { icon: string; value: string; label: string; tint: string; ink: string }) {
  return (
    <Card borderColor={props.tint} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: props.tint }]}>
        <AppText style={styles.statEmoji}>{props.icon}</AppText>
      </View>
      <AppText variant="headlineLg" color={props.ink}>
        {props.value}
      </AppText>
      <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
        {props.label}
      </AppText>
    </Card>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const wrongItems = entry.items.filter((item) => !item.correct);

  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.flex}>
          <AppText variant="labelLg">
            {SubjectIcons[entry.subject]} {SubjectNames[entry.subject]} · Lớp {entry.grade}
          </AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {formatDate(entry.createdAt)}
          </AppText>
        </View>
        <View style={styles.historyScore}>
          <AppText variant="headlineSm" color={Palette.blueDark}>
            {entry.score}/10
          </AppText>
        </View>
      </View>

      <AppText variant="bodyMd">{entry.parentNote}</AppText>

      {wrongItems.length > 0 && (
        <View style={styles.wrongList}>
          <AppText variant="labelMd" color={Palette.coralDark}>
            Câu bé làm sai ({wrongItems.length}):
          </AppText>
          {wrongItems.map((item, index) => (
            <AppText key={index} variant="bodySm" color={Palette.inkSoft}>
              • {item.question}: {item.explanation}
            </AppText>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  subjectCard: {
    gap: Spacing.two,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  levelTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  track: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Palette.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quote: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  dayBox: {
    width: 38,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCard: {
    gap: Spacing.two,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  historyScore: {
    backgroundColor: Palette.blueSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  wrongList: {
    gap: Spacing.half,
  },
  clear: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
});
