import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AccountCard } from '@/components/account-card';
import { PrivacyCard } from '@/components/privacy-card';
import { AppText } from '@/components/app-text';
import { ChoiceChips } from '@/components/choice-chips';
import { type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { tallyParts } from '../../../supabase/functions/_shared/cham-bai';
import { SubjectNames, type Subject } from '@/lib/grading';
import { clearHistory, loadHistory, type HistoryEntry } from '@/lib/history';
import { accuracy, allSubjects, averageScore, scoreLabel, SubjectIcons, thisWeek } from '@/lib/progress';
import { currentStreak } from '@/lib/rewards';
import { avatarEmoji, useProfile, useTeacher } from '@/lib/profile';
import { speakVietnamese } from '@/lib/speech';
import { APP_NAME } from '@/lib/teacher';
import { Columns } from '@/web/columns';
import { LegalLinks } from '@/web/legal-links';
import { Screen } from '@/web/screen';
import { WebPlusCard } from '@/web/plus-card';
import { useLayout } from '@/web/use-layout';

const subjectBarColors: Record<Subject, { bar: string; ink: string }> = {
  toan: { bar: Palette.mint, ink: Palette.blueDark },
  'tieng-viet': { bar: Palette.coral, ink: Palette.coralInk },
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
  const [filter, setFilter] = useState<Subject | 'all'>('all');
  const shown = filter === 'all' ? history : history.filter((entry) => entry.subject === filter);
  const teacher = useTeacher();
  const { profile, rewards } = useProfile();
  const { narrow } = useLayout();
  const streak = currentStreak(rewards, new Date());

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  const average = averageScore(history);
  const correctRate = accuracy(history);
  const week = thisWeek(history);
  const daysDone = week.filter((day) => day.done).length;

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

  const titleBlock = (
    <View style={styles.pageHead}>
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}>
          <MaterialIcons name="insights" size={26} color={Palette.blue} />
        </View>
        <View>
          <AppText variant="headlineLg">Báo cáo tiến độ</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Dành cho bố mẹ
          </AppText>
        </View>
      </View>
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <AppText style={styles.profileEmoji}>{avatarEmoji(profile?.avatar ?? '')}</AppText>
        </View>
        <View style={styles.flex}>
          <View style={styles.profileNameRow}>
            <AppText variant="headlineMd">Bé {profile?.name || 'yêu'}</AppText>
            <View style={styles.gradeTag}>
              <AppText variant="labelSm" color={Palette.blueDark}>
                Lớp {profile?.grade ?? ''}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Học cùng {teacher.name}
          </AppText>
          <View style={styles.profileChips}>
            <View style={[styles.chip, { backgroundColor: Palette.amberSoft }]}>
              <AppText variant="labelMd" color={Palette.amberInk}>
                ⭐ {rewards.stars} ngôi sao
              </AppText>
            </View>
            <View style={[styles.chip, { backgroundColor: Palette.coralSoft }]}>
              <AppText variant="labelMd" color={Palette.coralInk}>
                🔥 {streak} ngày liên tiếp
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );

  const accountBlocks = (
    <>
      <AccountCard />
      <WebPlusCard />
      <PrivacyCard />
    </>
  );

  const versionText = (
    <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
      {APP_NAME} {Constants.expoConfig?.version}
    </AppText>
  );

  if (history.length === 0) {
    const empty = (
      <Card style={styles.empty}>
        <Mascot variant="full" size={150} />
        <AppText variant="bodyLg" color={Palette.inkSoft} style={styles.center}>
          Chưa có bài nào được chấm. Kết quả sẽ hiện ở đây sau khi bé chụp bài.
        </AppText>
      </Card>
    );
    return (
      <Screen>
        {titleBlock}
        <Columns ratio={1.3} main={empty} aside={accountBlocks} />
        {versionText}
        <LegalLinks />
      </Screen>
    );
  }

  const statsRow = (
    <View style={styles.statsRow}>
      <StatTile icon="assignment-turned-in" value={String(history.length)} label="Bài đã chấm" tint={Palette.mintSoft} />
      <StatTile
        icon="star-outline"
        value={average === null ? '–' : average.toFixed(1)}
        label="Điểm TB"
        tint={Palette.amberSoft}
      />
      <StatTile
        icon="verified"
        value={correctRate === null ? '–' : `${Math.round(correctRate * 100)}%`}
        label="Câu đúng"
        tint={Palette.surfaceStrong}
      />
    </View>
  );

  const masteryCard = (
    <Card>
      <AppText variant="headlineSm">Mức độ thành thạo môn</AppText>
      {allSubjects.map((subject) => {
        const entries = history.filter((entry) => entry.subject === subject);
        const subjectAverage = averageScore(entries);
        const colors = subjectBarColors[subject];
        return (
          <View key={subject} style={styles.subjectBlock}>
            <View style={styles.subjectHeader}>
              <View style={[styles.dot, { backgroundColor: colors.bar }]} />
              <AppText variant="labelLg" style={styles.flex}>
                {SubjectIcons[subject]} {SubjectNames[subject]}
              </AppText>
              <AppText variant="labelLg" color={colors.ink}>
                {subjectAverage === null ? 'Chưa có bài' : `${Math.round(subjectAverage * 10)}%`}
              </AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(subjectAverage ?? 0) * 10}%`, backgroundColor: colors.bar }]} />
            </View>
            {subjectAverage !== null && (
              <AppText variant="bodySm" color={Palette.inkSoft}>
                {scoreLabel(subjectAverage)} · {entries.length} bài đã chấm
              </AppText>
            )}
          </View>
        );
      })}
    </Card>
  );

  const noteCard = (
    <Card>
      <View style={styles.noteHeader}>
        <Mascot size={56} />
        <View style={styles.flex}>
          <AppText variant="headlineSm">{teacher.name}</AppText>
          <AppText variant="labelMd" color={Palette.blue}>
            Nhận xét mới nhất · {formatDate(history[0].createdAt)}
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => speakVietnamese(history[0].parentNote, undefined, teacher.id)}
        style={({ pressed }) => [styles.listenRow, pressed && styles.pressed]}>
        <View style={styles.playDot}>
          <MaterialIcons name="play-arrow" size={26} color={Palette.white} />
        </View>
        <AppText variant="labelLg" style={styles.flex}>
          Nghe {teacher.word} nhận xét 🎧
        </AppText>
      </Pressable>
      <View style={styles.tipBox}>
        <MaterialIcons name="lightbulb-outline" size={20} color={Palette.amberInk} />
        <AppText variant="bodyMd" style={styles.flex}>
          <AppText variant="labelLg">Gợi ý cho ba mẹ: </AppText>
          {history[0].parentNote}
        </AppText>
      </View>
    </Card>
  );

  const weekCard = (
    <Card>
      <View style={styles.weekHeader}>
        <MaterialIcons name="event-available" size={22} color={Palette.coralInk} />
        <AppText variant="headlineSm" style={styles.flex}>
          Điểm danh 7 ngày
        </AppText>
        <AppText variant="labelMd" color={Palette.blue}>
          {daysDone}/7 ngày
        </AppText>
      </View>
      <View style={styles.weekRow}>
        {week.map((day) => (
          <View key={day.label} style={styles.dayColumn}>
            <AppText variant="labelSm" color={day.isToday ? Palette.blue : Palette.inkSoft}>
              {day.label}
            </AppText>
            <View
              style={[
                styles.dayCircle,
                day.done
                  ? { backgroundColor: day.isToday ? Palette.blue : Palette.mint }
                  : { backgroundColor: Palette.surfaceMuted },
              ]}>
              {day.done && (
                <MaterialIcons
                  name={day.isToday ? 'star' : 'check'}
                  size={20}
                  color={day.isToday ? Palette.white : Palette.blueDark}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const historySection = (
    <View style={styles.section}>
      <AppText variant="headlineSm">Lịch sử chấm bài</AppText>
      <ChoiceChips
        options={[
          { value: 'all' as const, label: `Tất cả (${history.length})` },
          ...allSubjects.map((subject) => ({
            value: subject,
            label: `${SubjectIcons[subject]} ${SubjectNames[subject]} (${history.filter((entry) => entry.subject === subject).length})`,
          })),
        ]}
        value={filter}
        onChange={setFilter}
      />
      {shown.length === 0 ? (
        <AppText variant="bodyMd" color={Palette.inkSoft}>
          Chưa có bài nào của môn này.
        </AppText>
      ) : (
        <View style={styles.historyGrid}>
          {shown.map((entry) => (
            <View key={entry.id} style={[styles.historyCell, narrow && styles.historyCellFull]}>
              <HistoryCard entry={entry} />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const clearButton = (
    <Pressable accessibilityRole="button" onPress={confirmClear} style={styles.clear}>
      <AppText variant="labelMd" color={Palette.coralDark}>
        Xoá lịch sử
      </AppText>
    </Pressable>
  );

  // Cửa sổ hẹp thì Columns tự xếp dọc.
  return (
    <Screen>
      {titleBlock}
      {statsRow}
      <Columns
        ratio={1.5}
        main={
          <>
            {masteryCard}
            {weekCard}
            {historySection}
            {clearButton}
          </>
        }
        aside={
          <>
            {noteCard}
            {accountBlocks}
          </>
        }
      />
      {versionText}
      <LegalLinks />
    </Screen>
  );
}

function StatTile(props: { icon: IconName; value: string; label: string; tint: string }) {
  return (
    <View style={[styles.statTile, { backgroundColor: props.tint }]}>
      <View style={styles.statIcon}>
        <MaterialIcons name={props.icon} size={22} color={Palette.blue} />
      </View>
      <AppText variant="headlineLg">{props.value}</AppText>
      <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
        {props.label}
      </AppText>
    </View>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { correct, total } = tallyParts(entry.items);
  const wrongCount = total - correct;
  const pageCount = Math.max(entry.pages?.length ?? 0, entry.imagePaths?.length ?? 0);
  const thumbnail = entry.pages?.[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem bài ${SubjectNames[entry.subject]} ngày ${formatDate(entry.createdAt)}`}
      onPress={() => router.push({ pathname: '/bai-cham/[id]', params: { id: entry.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.historyCard}>
        <View style={styles.historyHeader}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} contentFit="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
              <AppText style={styles.thumbnailEmoji}>{SubjectIcons[entry.subject]}</AppText>
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="labelLg">
              {SubjectNames[entry.subject]} · Lớp {entry.grade}
            </AppText>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              {formatDate(entry.createdAt)}
              {pageCount > 0 ? ` · ${pageCount} trang` : ''}
            </AppText>
            {wrongCount > 0 && (
              <AppText variant="labelSm" color={Palette.coralDark}>
                {wrongCount} câu cần sửa
              </AppText>
            )}
          </View>
          <View style={styles.historyScore}>
            <AppText variant="labelLg" color={Palette.blueDark}>
              {entry.score}/10
            </AppText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Palette.inkSoft} />
        </View>
        <AppText variant="bodySm" numberOfLines={2}>
          {entry.parentNote}
        </AppText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  pageHead: {
    gap: Spacing.three,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  profileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 46,
    lineHeight: 56,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  gradeTag: {
    backgroundColor: Palette.surfaceStrong,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 1,
  },
  profileChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  historyCell: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 280,
  },
  historyCellFull: {
    flexBasis: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: Spacing.two + 2,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three + 4,
    paddingHorizontal: Spacing.two,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBlock: {
    gap: Spacing.two,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  listenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.full,
    padding: Spacing.two,
  },
  playDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  thumbnail: {
    width: 56,
    height: 72,
    borderRadius: 12,
    backgroundColor: Palette.surfaceMuted,
  },
  thumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  clear: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
});
