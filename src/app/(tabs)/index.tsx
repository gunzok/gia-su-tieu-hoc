import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type Subject } from '@/lib/grading';
import { useGreeting } from '@/lib/greetings';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { avatarEmoji, useProfile, useTeacher } from '@/lib/profile';
import { allSubjects } from '@/lib/progress';
import { currentStreak, streakMessage } from '@/lib/rewards';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';


const subjectStyles: Record<Subject, { tint: string; dot: string; ink: string; icon: IconName }> = {
  toan: { tint: Palette.mintSoft, dot: Palette.blue, ink: Palette.blueDark, icon: 'calculate' },
  'tieng-viet': { tint: Palette.coralSoft, dot: Palette.coralInk, ink: Palette.coralInk, icon: 'spellcheck' },
};

export default function HomeScreen() {
  const { grade, setSubject } = useHomeworkSession();
  const { profile, rewards } = useProfile();
  const now = new Date();
  const streak = currentStreak(rewards, now);
  const T = useTeacher();
  const childName = profile?.name ? `${profile.name} yêu` : 'con yêu';
  const greeting = useGreeting(childName, T);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
      return () => {
        stopSpeaking();
        setSpeaking(false);
      };
    }, []),
  );

  function toggleGreeting() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    // Bỏ emoji ở tiêu đề để giọng đọc không đọc tên biểu tượng.
    const title = greeting.title.replace(/[^\p{L}\p{N}\s,.!?]/gu, '').trim();
    speakVietnamese(`${title} ${greeting.body}`, { onDone: () => setSpeaking(false) }, T.id);
  }

  function startSubject(subject: Subject) {
    setSubject(subject);
    router.navigate('/quet-bai');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="headlineMd">{profile?.name ? `Chào ${profile.name}! 🌟` : 'Chào con! 🌟'}</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Lớp {grade}
          </AppText>
        </View>
        <View
          accessible
          accessibilityLabel={`Con có ${rewards.stars} ngôi sao. Chuỗi ${streak} ngày học`}
          style={styles.statsPill}>
          <AppText style={styles.pillIcon}>⭐</AppText>
          <AppText variant="labelLg" color={Palette.amberInk}>
            {rewards.stars}
          </AppText>
          <AppText variant="labelLg" color={Palette.amberInk}>
            ·
          </AppText>
          <AppText style={styles.pillIcon}>🔥</AppText>
          <AppText variant="labelLg" color={Palette.amberInk}>
            {streak}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hồ sơ của bé"
          onPress={() => router.push('/sua-ho-so')}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}>
          <AppText style={styles.avatarEmoji}>{avatarEmoji(profile?.avatar ?? '')}</AppText>
        </Pressable>
      </View>

      <Card style={styles.subjectCard}>
        <View style={styles.subjectIntro}>
          <AppText variant="headlineMd">Hôm nay con làm bài môn nào?</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {streakMessage(rewards, now)}
          </AppText>
        </View>
        <View style={styles.subjectRow}>
          {allSubjects.map((subject) => {
            const look = subjectStyles[subject];
            return (
              <Pressable
                key={subject}
                accessibilityRole="button"
                accessibilityLabel={`Chụp bài ${SubjectNames[subject]} lớp ${grade}`}
                onPress={() => startSubject(subject)}
                style={({ pressed }) => [styles.subjectTile, { backgroundColor: look.tint }, pressed && styles.pressed]}>
                <View style={[styles.subjectIcon, { backgroundColor: look.dot }]}>
                  <MaterialIcons name={look.icon} size={28} color={Palette.white} />
                </View>
                <AppText variant="headlineSm" color={look.ink}>
                  {SubjectNames[subject]} {grade}
                </AppText>
                <View style={styles.subjectAction}>
                  <MaterialIcons name="photo-camera" size={20} color={look.ink} />
                  <AppText variant="labelLg" color={look.ink}>
                    Chụp bài
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.greetingCard}>
        <Mascot size={52} />
        <View style={styles.flex}>
          <AppText variant="labelLg" color={Palette.blueDark}>
            {speaking ? `${T.Title} đang nói…` : `${T.Title} dặn hôm nay`}
          </AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {greeting.body}
          </AppText>
        </View>
        <ItemSpeakButton
          number={0}
          speakingNow={speaking}
          onSpeak={toggleGreeting}
          label={`Nghe ${T.word} dặn hôm nay`}
        />
      </Card>

      {history[0] && (
        <Card tint={Palette.amberSoft} borderColor={Palette.amberSoft} style={styles.latestCard}>
          <View style={styles.latestScore}>
            <AppText variant="headlineLg" color={Palette.amberInk}>
              {history[0].score}
            </AppText>
            <AppText variant="labelSm" color={Palette.amberInk}>
              /10
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="labelSm" color={Palette.amberInk}>
              Bài gần nhất
            </AppText>
            <AppText variant="labelLg">
              {SubjectNames[history[0].subject]} lớp {history[0].grade}
            </AppText>
          </View>
          <BigButton label="Xem lại" compact variant="ghost" onPress={() => router.navigate('/chua-bai')} />
        </Card>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/tien-do')}
        style={({ pressed }) => [styles.parentRow, pressed && styles.pressed]}>
        <View style={styles.parentIcon}>
          <MaterialIcons name="family-restroom" size={24} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">Góc phụ huynh</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Xem tiến độ và lời nhận xét cho bố mẹ
          </AppText>
        </View>
        <MaterialIcons name="chevron-right" size={28} color={Palette.inkSoft} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.amber,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  pillIcon: {
    fontSize: 16,
    lineHeight: 22,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  subjectCard: {
    gap: Spacing.three + 4,
  },
  subjectIntro: {
    gap: Spacing.one,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  subjectTile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
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
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.three,
  },
  parentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
