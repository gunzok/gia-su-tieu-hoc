import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AskTeacherButton } from '@/components/ask-teacher-button';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { RetryQuestion } from '@/components/retry-question';
import { Screen } from '@/components/screen';
import { PulseRing } from '@/components/sound-wave';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { essayWords, itemParts } from '../../../supabase/functions/_shared/cham-bai';
import { SubjectNames, type GradedItem, type Subject } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { openAskTeacher } from '@/lib/hoi-co';
import { itemSpeech } from '@/lib/item-speech';
import { useTeacher } from '@/lib/profile';
import { praiseForScore } from '@/lib/progress';
import { STARS_PER_GRADING } from '@/lib/rewards';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReviewScreen() {
  const { latest, latestReward, startOver, speaking, speak, stopSpeech } = useHomeworkSession();
  const T = useTeacher();
  const [saved, setSaved] = useState<HistoryEntry | null>(null);
  // Câu đang được giảng lại (null = lời nhận xét chung, "retry-<số>" = lời cô ở phần làm lại câu đó).
  const [activeItem, setActiveItem] = useState<number | `retry-${number}` | null>(null);
  const feedbackSpeaking = speaking && activeItem === null;

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => setSaved(history[0] ?? null));
      return stopSpeech;
    }, [stopSpeech]),
  );

  const entry = latest ?? saved;

  function toggleSpeech() {
    if (!entry) return;
    if (feedbackSpeaking) {
      stopSpeech();
    } else {
      setActiveItem(null);
      speak(entry.spokenFeedback);
    }
  }

  function replay() {
    if (!entry) return;
    setActiveItem(null);
    speak(entry.spokenFeedback);
  }

  function toggleItem(index: number) {
    if (!entry) return;
    if (speaking && activeItem === index) {
      stopSpeech();
    } else {
      setActiveItem(index);
      speak(itemSpeech(entry.items[index], index + 1, T));
    }
  }

  function scanAnother() {
    startOver();
    router.navigate('/quet-bai');
  }

  if (!entry) {
    return (
      <Screen>
        <AppText variant="headlineMd">Chữa bài</AppText>
        <Card style={styles.empty}>
          <Mascot variant="full" size={150} />
          <AppText variant="headlineSm" style={styles.center}>
            Chưa có bài nào được chấm
          </AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
            Con chụp bài tập đã làm, {T.Title} sẽ chấm và giảng lại ở đây nhé!
          </AppText>
          <BigButton label="Chụp bài ngay" icon="photo-camera" onPress={scanAnother} />
        </Card>
      </Screen>
    );
  }

  const wrongItems = entry.items.map((item, index) => ({ item, index })).filter(({ item }) => !item.correct);
  const correctItems = entry.items.map((item, index) => ({ item, index })).filter(({ item }) => item.correct);
  const pageCount = Math.max(entry.pages?.length ?? 0, entry.imagePaths?.length ?? 0);

  function rowProps(index: number) {
    const current = entry!;
    const item = current.items[index];
    return {
      speakingNow: speaking && activeItem === index,
      onSpeak: () => toggleItem(index),
      onAsk: () => {
        stopSpeech();
        openAskTeacher({ item, number: index + 1, subject: current.subject, grade: current.grade });
      },
    };
  }

  return (
    <Screen>
      <View>
        <AppText variant="headlineMd">
          Bài {SubjectNames[entry.subject]} lớp {entry.grade}
        </AppText>
        <AppText variant="bodySm" color={Palette.inkSoft}>
          {formatDate(entry.createdAt)}
          {pageCount > 0 ? ` · ${pageCount} trang vở` : ''}
        </AppText>
      </View>

      {entry.items.length > 0 ? (
        <View
          accessible
          accessibilityLabel={`${entry.score} trên 10 điểm. ${praiseForScore(entry.score)} Đúng ${correctItems.length} trên ${entry.items.length} câu.`}
          style={styles.hero}>
          <View style={styles.scoreRing}>
            <View style={styles.scoreValue}>
              <AppText style={styles.scoreNumber}>{entry.score}</AppText>
              <AppText variant="labelLg" color={Palette.amberInk}>
                /10
              </AppText>
            </View>
          </View>
          <View style={styles.heroText}>
            <AppText variant="headlineSm" color={Palette.amberInk}>
              {praiseForScore(entry.score)} 🎉
            </AppText>
            <AppText variant="bodyMd" color={Palette.amberInk}>
              Đúng {correctItems.length}/{entry.items.length} câu.
              {wrongItems.length > 0
                ? ` Cùng sửa ${wrongItems.length} câu với ${T.word} nhé!`
                : ` Con làm đúng hết rồi!`}
            </AppText>
          </View>
        </View>
      ) : (
        <Card style={styles.empty}>
          <Mascot variant="full" size={130} />
          <AppText variant="headlineSm" style={styles.center}>
            {T.Title} chưa đọc được bài
          </AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
            Con chụp lại giúp {T.word} nhé!
          </AppText>
          <BigButton label="Chụp lại" icon="photo-camera" onPress={scanAnother} />
        </Card>
      )}

      {/* Chỉ khen sao ngay sau bài vừa chấm, không hiện lại khi xem bài cũ. */}
      {latestReward && entry === latest && (
        <View
          accessible
          accessibilityLabel={`Con được thêm ${STARS_PER_GRADING} ngôi sao. Học liên tiếp ${latestReward.streak} ngày`}
          style={styles.rewardRow}>
          <View style={[styles.rewardChip, { backgroundColor: Palette.amberSoft }]}>
            <AppText style={styles.rewardIcon}>⭐</AppText>
            <AppText variant="labelLg" color={Palette.amberInk}>
              +{STARS_PER_GRADING} sao
            </AppText>
          </View>
          <View style={[styles.rewardChip, { backgroundColor: Palette.coralSoft }]}>
            <AppText style={styles.rewardIcon}>🔥</AppText>
            <AppText variant="labelLg" color={Palette.coralInk}>
              {latestReward.streak > 1 ? `${latestReward.streak} ngày liền!` : 'Ngày 1, cố lên!'}
            </AppText>
          </View>
        </View>
      )}

      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Mascot size={52} background={Palette.white} />
          <View style={styles.flex}>
            <AppText variant="labelLg" color={Palette.blueDark}>
              {feedbackSpeaking ? `${T.name} đang giảng` : `Lời ${T.word} nhận xét`}
            </AppText>
            <AppText variant="bodySm" color={Palette.blueDark}>
              Con lắng nghe giọng {T.word} nhé!
            </AppText>
          </View>
          <RoundButton icon="replay" label="Nghe lại từ đầu" onPress={replay} />
          <View style={styles.playWrap}>
            <PulseRing active={feedbackSpeaking} size={60} color={Palette.blue} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={feedbackSpeaking ? 'Dừng đọc' : `Nghe ${T.word} nhận xét`}
              onPress={toggleSpeech}
              style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
              <MaterialIcons name={feedbackSpeaking ? 'pause' : 'play-arrow'} size={36} color={Palette.white} />
            </Pressable>
          </View>
        </View>
        <AppText variant="bodyMd" numberOfLines={2}>
          “{entry.spokenFeedback}”
        </AppText>
      </View>

      {wrongItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="headlineSm" style={styles.flex}>
              Cần sửa
            </AppText>
            <AppText variant="labelLg" color={Palette.coralInk}>
              {wrongItems.length} câu
            </AppText>
          </View>
          {wrongItems.map(({ item, index }) => {
            const retryKey = `retry-${index}` as const;
            return (
              <WrongRow
                key={index}
                item={item}
                number={index + 1}
                subject={entry.subject}
                grade={entry.grade}
                retrySpeaking={speaking && activeItem === retryKey}
                onRetrySpeak={(text) => {
                  setActiveItem(retryKey);
                  speak(text);
                }}
                stopSpeech={stopSpeech}
                {...rowProps(index)}
              />
            );
          })}
        </View>
      )}

      {correctItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="headlineSm" style={styles.flex}>
              Con làm đúng
            </AppText>
            <AppText variant="labelLg" color={Palette.blue}>
              {correctItems.length} câu
            </AppText>
          </View>
          <Card style={styles.correctList}>
            {correctItems.map(({ item, index }, position) => (
              <CorrectRow
                key={index}
                item={item}
                number={index + 1}
                last={position === correctItems.length - 1}
                {...rowProps(index)}
              />
            ))}
          </Card>
        </View>
      )}

      <BigButton label="Chụp bài khác" icon="photo-camera" onPress={scanAnother} />
    </Screen>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: 'replay';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={26} color={Palette.blueDark} />
    </Pressable>
  );
}

function NumberBubble({ number, tint, ink }: { number: number; tint: string; ink: string }) {
  return (
    <View style={[styles.numberBubble, { backgroundColor: tint }]}>
      <AppText variant="labelLg" color={ink}>
        {number}
      </AppText>
    </View>
  );
}

type RowProps = {
  item: GradedItem;
  number: number;
  /** Câu này đang được đọc. */
  speakingNow: boolean;
  onSpeak: () => void;
  onAsk: () => void;
};

function CorrectRow({
  item,
  number,
  speakingNow,
  onSpeak,
  last,
}: Omit<RowProps, 'onAsk'> & { last: boolean }) {
  return (
    <View style={[styles.correctRow, !last && styles.correctDivider]}>
      <MaterialIcons name="check-circle-outline" size={26} color={Palette.blue} />
      <AppText variant="bodyMd" numberOfLines={1} style={styles.flex}>
        {number}. {item.question}
      </AppText>
      <ItemSpeakButton speakingNow={speakingNow} onSpeak={onSpeak} number={number} />
    </View>
  );
}

type WrongRowProps = RowProps & {
  subject: Subject;
  grade: number;
  /** Lời cô ở phần "Thử lại câu này" đang được đọc. */
  retrySpeaking: boolean;
  onRetrySpeak: (text: string) => void;
  stopSpeech: () => void;
};

function WrongRow({
  item,
  number,
  speakingNow,
  onSpeak,
  onAsk,
  subject,
  grade,
  retrySpeaking,
  onRetrySpeak,
  stopSpeech,
}: WrongRowProps) {
  // Bé đang làm lại thì che đáp án đúng, để bé tự nghĩ.
  const [hideAnswer, setHideAnswer] = useState(false);
  const parts = itemParts(item);
  const essay = essayWords(item);
  const rightAnswer = essay?.fixes.length
    ? essay.fixes.join('; ')
    : parts
      ? parts
          .filter((part) => !part.correct)
          .map((part) => part.right)
          .join('; ')
      : item.correctAnswer;
  return (
    <View style={[styles.row, { backgroundColor: Palette.coralSoft }]}>
      <View style={styles.rowHeader}>
        <NumberBubble number={number} tint={Palette.coral} ink={Palette.coralInk} />
        <View style={styles.flex}>
          <AppText variant="labelLg">{item.question}</AppText>
          <AppText variant="labelMd" color={Palette.coralDark}>
            Con viết:{' '}
            {essay ? (
              essay.words.map((word, index) => (
                <AppText key={index} style={word.wrong ? styles.strike : undefined}>
                  {word.text}
                  {index < essay.words.length - 1 ? ' ' : ''}
                </AppText>
              ))
            ) : parts ? (
              parts.map((part, index) => (
                <AppText key={index} style={part.correct ? undefined : styles.strike}>
                  {part.child}
                  {index < parts.length - 1 ? '; ' : ''}
                </AppText>
              ))
            ) : (
              <AppText style={styles.strike}>{item.childAnswer}</AppText>
            )}
          </AppText>
          {rightAnswer && !hideAnswer ? (
            <AppText variant="labelMd" color={Palette.blue}>
              Đúng là: {rightAnswer}
            </AppText>
          ) : null}
        </View>
        <ItemSpeakButton speakingNow={speakingNow} onSpeak={onSpeak} number={number} />
      </View>
      {!hideAnswer && (
        <View style={styles.explainBox}>
          <AppText variant="bodyMd">{item.explanation}</AppText>
        </View>
      )}
      <View style={styles.rowActions}>
        <AskTeacherButton onPress={onAsk} />
      </View>
      <RetryQuestion
        item={item}
        number={number}
        subject={subject}
        grade={grade}
        speakingNow={retrySpeaking}
        speak={onRetrySpeak}
        stopSpeech={stopSpeech}
        onHideAnswer={setHideAnswer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  correctDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  correctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.two,
  },
  correctList: {
    gap: 0,
    paddingVertical: Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  playWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontFamily: FontFamily.heading,
    fontSize: 44,
    lineHeight: 52,
    color: Palette.amberInk,
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 8,
    borderColor: Palette.amber,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rewardChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  rewardIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 4,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
  },
  heroText: {
    flex: 1,
    gap: Spacing.one,
  },
  voiceCard: {
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
    gap: Spacing.three,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
    gap: Spacing.two + 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  numberBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  explainBox: {
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  strike: {
    fontFamily: FontFamily.label,
    textDecorationLine: 'line-through',
  },
});
