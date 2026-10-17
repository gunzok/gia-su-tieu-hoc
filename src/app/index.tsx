import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader, HeaderPill } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type Subject } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { allSubjects, averageScore, SubjectIcons } from '@/lib/progress';
import { speakVietnamese } from '@/lib/speech';

const greeting =
  'Chào con! Con chụp bài tập đã làm, cô sẽ chấm và nhận xét cho con nghe nhé!';

const subjectTints: Record<Subject, { soft: string; strong: string; button: 'primary' | 'amber' }> = {
  toan: { soft: Palette.blueSoft, strong: Palette.blueDark, button: 'primary' },
  'tieng-viet': { soft: Palette.amberSoft, strong: Palette.amberInk, button: 'amber' },
};

export default function HomeScreen() {
  const { grade, setSubject } = useHomeworkSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  function startSubject(subject: Subject) {
    setSubject(subject);
    router.navigate('/quet-bai');
  }

  return (
    <Screen>
      <AppHeader
        subtitle={`Lớp ${grade}`}
        right={<HeaderPill icon="📚" label={`${history.length} bài`} />}
      />

      <Card borderColor={Palette.blueSoft} style={styles.greetingCard}>
        <View style={styles.greetingText}>
          <View style={styles.tag}>
            <AppText variant="labelSm" color={Palette.blueDark}>
              👋 Xin chào!
            </AppText>
          </View>
          <AppText variant="headlineLg">Hôm nay con học gì nào?</AppText>
          <BigButton label="🔊 Nghe cô dặn" compact onPress={() => speakVietnamese(greeting)} />
        </View>
        <Mascot size={92} />
      </Card>

      <View style={styles.hero}>
        <View style={styles.heroTag}>
          <AppText variant="labelSm" color={Palette.white}>
            ⚡ AI SIÊU TỐC
          </AppText>
        </View>
        <AppText variant="headlineXl" color={Palette.white}>
          Chấm Bài Ngay!
        </AppText>
        <AppText variant="bodySm" color={Palette.blueSoft}>
          Chụp ảnh bài làm, cô chấm điểm và giảng lại cho con nghe.
        </AppText>
        <BigButton label="📷  1 CHẠM CHẤM NGAY" variant="amber" onPress={() => router.navigate('/quet-bai')} />
      </View>

      <View style={styles.section}>
        <AppText variant="headlineSm">📚 Khám phá môn học</AppText>
        <View style={styles.subjectRow}>
          {allSubjects.map((subject) => {
            const tint = subjectTints[subject];
            const average = averageScore(history.filter((entry) => entry.subject === subject));
            return (
              <Card key={subject} borderColor={tint.soft} style={styles.subjectCard}>
                <View style={[styles.subjectIcon, { backgroundColor: tint.soft }]}>
                  <AppText style={styles.subjectEmoji}>{SubjectIcons[subject]}</AppText>
                </View>
                <AppText variant="labelLg" color={tint.strong} style={styles.center}>
                  {SubjectNames[subject]} {grade}
                </AppText>
                <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
                  {average === null ? 'Chưa có bài' : `Điểm TB ${average.toFixed(1)}`}
                </AppText>
                <BigButton
                  label="Học ▷"
                  compact
                  variant={tint.button}
                  onPress={() => startSubject(subject)}
                />
              </Card>
            );
          })}
        </View>
      </View>

      {history[0] && (
        <Card tint={Palette.amberSoft} borderColor="#FFE3A3" style={styles.latestCard}>
          <View style={styles.latestScore}>
            <AppText variant="headlineLg" color={Palette.amberInk}>
              {history[0].score}
            </AppText>
            <AppText variant="labelSm" color={Palette.amberInk}>
              /10
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="labelLg">Bài gần nhất</AppText>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              {SubjectNames[history[0].subject]} · Lớp {history[0].grade}
            </AppText>
          </View>
          <BigButton label="Xem lại" compact variant="ghost" onPress={() => router.navigate('/chua-bai')} />
        </Card>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/tien-do')}
        style={styles.parentRow}>
        <AppText style={styles.parentEmoji}>👨‍👩‍👧</AppText>
        <View style={styles.flex}>
          <AppText variant="labelMd">Góc phụ huynh</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Xem tiến độ và lời nhận xét cho bố mẹ
          </AppText>
        </View>
        <View style={styles.parentButton}>
          <AppText variant="labelMd" color={Palette.blueDark}>
            Xem ngay
          </AppText>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Palette.blue,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  greetingText: {
    flex: 1,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  tag: {
    backgroundColor: Palette.blueSoft,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  hero: {
    backgroundColor: Palette.blue,
    borderRadius: Radius.lg,
    borderBottomWidth: 5,
    borderColor: Palette.blueDark,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  section: {
    gap: Spacing.three,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  subjectCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  subjectIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectEmoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  parentEmoji: {
    fontSize: 28,
    lineHeight: 36,
  },
  parentButton: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
