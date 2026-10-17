import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type GradedItem } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { praiseForScore } from '@/lib/progress';

const waveHeights = [18, 30, 22, 40, 28, 46, 34, 24, 38, 20, 30, 16];
const waveColors = [Palette.amber, '#7DD3FC', Palette.mint, '#F9A8D4'];

export default function ReviewScreen() {
  const { latest, startOver, speaking, speak, stopSpeech } = useHomeworkSession();
  const [saved, setSaved] = useState<HistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => setSaved(history[0] ?? null));
      return stopSpeech;
    }, [stopSpeech]),
  );

  const entry = latest ?? saved;

  function toggleSpeech() {
    if (!entry) return;
    if (speaking) stopSpeech();
    else speak(entry.spokenFeedback);
  }

  function scanAnother() {
    startOver();
    router.navigate('/quet-bai');
  }

  if (!entry) {
    return (
      <Screen>
        <AppHeader subtitle="Chữa bài" />
        <Card style={styles.empty}>
          <Mascot size={110} />
          <AppText variant="headlineMd" style={styles.center}>
            Chưa có bài nào được chấm
          </AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
            Con chụp bài tập đã làm, cô sẽ chấm và giảng lại ở đây nhé!
          </AppText>
          <BigButton label="📷  Chụp bài ngay" variant="amber" onPress={scanAnother} />
        </Card>
      </Screen>
    );
  }

  const correctItems = entry.items.filter((item) => item.correct);
  const wrongItems = entry.items.filter((item) => !item.correct);

  return (
    <Screen>
      <AppHeader subtitle={`Lớp ${entry.grade} • Chữa bài`} />

      <View style={styles.hero}>
        <View style={styles.trophy}>
          <AppText style={styles.trophyEmoji}>🏆</AppText>
          <AppText variant="labelSm" color={Palette.amberInk} style={styles.center}>
            {praiseForScore(entry.score)}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <View style={styles.scoreRow}>
            <AppText style={styles.score}>{entry.score}</AppText>
            <AppText variant="labelLg" color={Palette.ink}>
              /10 điểm
            </AppText>
          </View>
          {entry.items.length > 0 && (
            <View style={styles.heroPill}>
              <AppText variant="labelMd" color={Palette.mintDark}>
                🎯 Đúng {correctItems.length}/{entry.items.length} câu!
              </AppText>
            </View>
          )}
        </View>
        <Mascot size={56} background={Palette.white} />
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="headlineSm">📝 Vở bài tập của con</AppText>
        <View style={styles.autoTag}>
          <AppText variant="labelSm" color={Palette.mintDark}>
            ● {SubjectNames[entry.subject]}
          </AppText>
        </View>
      </View>

      {correctItems.length > 0 && (
        <View style={styles.correctGrid}>
          {correctItems.map((item, index) => (
            <CorrectCard key={index} item={item} number={entry.items.indexOf(item) + 1} />
          ))}
        </View>
      )}

      {wrongItems.map((item, index) => (
        <WrongCard key={index} item={item} number={entry.items.indexOf(item) + 1} />
      ))}

      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Mascot size={52} background={Palette.white} />
          <View style={styles.flex}>
            <AppText variant="headlineSm" color={Palette.white}>
              {speaking ? 'Cô đang giảng' : 'Lời cô nhận xét'}
            </AppText>
            <AppText variant="bodySm" color={Palette.blueSoft}>
              Con lắng nghe giọng cô nhé!
            </AppText>
          </View>
        </View>

        <View style={styles.wave}>
          {waveHeights.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: speaking ? height : 10,
                  backgroundColor: waveColors[index % waveColors.length],
                },
              ]}
            />
          ))}
        </View>

        <AppText variant="bodyLg" color={Palette.white}>
          {entry.spokenFeedback}
        </AppText>

        <View style={styles.voiceControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Dừng đọc' : 'Nghe cô nhận xét'}
            onPress={toggleSpeech}>
            {({ pressed }) => (
              <View
                style={[
                  styles.playButton,
                  { borderBottomWidth: pressed ? 2 : 6, transform: [{ translateY: pressed ? 3 : 0 }] },
                ]}>
                <AppText style={styles.playEmoji}>{speaking ? '⏸' : '🔊'}</AppText>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <BigButton label="📷  Chụp bài khác" variant="mint" onPress={scanAnother} />
    </Screen>
  );
}

function CorrectCard({ item, number }: { item: GradedItem; number: number }) {
  return (
    <Card borderColor={Palette.mintSoft} style={styles.correctCard}>
      <View style={styles.correctHeader}>
        <AppText variant="labelSm" color={Palette.inkSoft}>
          Câu {number}
        </AppText>
        <View style={styles.check}>
          <AppText variant="labelLg" color={Palette.mintDark}>
            ✓
          </AppText>
        </View>
      </View>
      <AppText variant="labelLg">{item.question}</AppText>
      <AppText variant="labelLg" color={Palette.mintDark}>
        = {item.childAnswer}
      </AppText>
    </Card>
  );
}

function WrongCard({ item, number }: { item: GradedItem; number: number }) {
  return (
    <Card borderColor="#FFD66B">
      <View style={styles.wrongHeader}>
        <View style={styles.numberBubble}>
          <AppText variant="labelMd" color={Palette.amberInk}>
            {number}
          </AppText>
        </View>
        <AppText variant="headlineSm" style={styles.flex}>
          {item.question}
        </AppText>
      </View>
      <View style={styles.hintTag}>
        <AppText variant="labelSm" color={Palette.amberInk}>
          💡 Cùng sửa một xíu nhé!
        </AppText>
      </View>
      <View style={[styles.answerBox, styles.childBox]}>
        <AppText variant="labelMd" color={Palette.coralDark}>
          ❌ Con ghi:
        </AppText>
        <AppText variant="headlineSm" color={Palette.coralDark} style={styles.strike}>
          {item.childAnswer}
        </AppText>
      </View>
      <View style={[styles.answerBox, styles.fixBox]}>
        <AppText variant="labelMd" color={Palette.mintDark}>
          ✅ Cô giảng:
        </AppText>
        <AppText variant="bodyLg">{item.explanation}</AppText>
      </View>
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
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFE38A',
    borderColor: Palette.amber,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  trophy: {
    width: 68,
    paddingVertical: Spacing.two,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  heroText: {
    flex: 1,
    gap: Spacing.two,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  score: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 48,
    lineHeight: 56,
    color: Palette.blueDark,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: -Spacing.two,
  },
  autoTag: {
    backgroundColor: Palette.mintSoft,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  correctGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  correctCard: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.one,
  },
  correctHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  numberBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTag: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  answerBox: {
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  childBox: {
    backgroundColor: Palette.coralSoft,
    borderColor: '#FFC2C2',
  },
  fixBox: {
    backgroundColor: Palette.mintSoft,
    borderColor: Palette.mintDark,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  voiceCard: {
    backgroundColor: '#2F6FE4',
    borderColor: Palette.blueDark,
    borderBottomWidth: 5,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  wave: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,40,110,0.35)',
    borderRadius: Radius.md,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
  },
  voiceControls: {
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.amber,
    borderColor: Palette.amberDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
});
