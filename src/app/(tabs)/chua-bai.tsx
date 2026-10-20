import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AskTeacherButton } from '@/components/ask-teacher-button';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { RetryQuestion } from '@/components/retry-question';
import { Screen } from '@/components/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type GradedItem, type Subject } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { openAskTeacher } from '@/lib/hoi-co';
import { itemSpeech } from '@/lib/item-speech';
import { useTeacher } from '@/lib/profile';
import { praiseForScore } from '@/lib/progress';
import { STARS_PER_GRADING } from '@/lib/rewards';
import { SoundWave } from '@/components/sound-wave';

const waveHeights = [14, 24, 18, 32, 22, 36, 26, 18, 30, 16, 24, 12, 20, 28];
const waveColors = [Palette.blue, Palette.amber, Palette.white, Palette.coral];

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
        <AppHeader subtitle="Chữa bài" />
        <Card style={styles.empty}>
          <Mascot variant="full" size={160} />
          <AppText variant="headlineMd" style={styles.center}>
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

  const correctCount = entry.items.filter((item) => item.correct).length;

  return (
    <Screen>
      <AppHeader subtitle={`Lớp ${entry.grade} • Chữa bài`} />

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <View style={styles.heroTag}>
            <AppText variant="labelSm" color={Palette.amberInk}>
              🏆 {praiseForScore(entry.score)} {entry.score}/10 điểm 🎉
            </AppText>
          </View>
          <AppText variant="headlineMd" color={Palette.amberInk}>
            Bài {SubjectNames[entry.subject]} lớp {entry.grade}
          </AppText>
          <AppText variant="bodyMd" color={Palette.amberInk}>
            {entry.items.length > 0
              ? `Con làm đúng ${correctCount}/${entry.items.length} câu. Cùng sửa với ${T.word} nhé!`
              : `${T.Title} chưa đọc được bài, con chụp lại giúp ${T.word} nhé!`}
          </AppText>
        </View>
        <View style={styles.medal}>
          <MaterialIcons name="military-tech" size={34} color={Palette.amberInk} />
        </View>
      </View>

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
          <Mascot size={60} background={Palette.white} />
          <View style={styles.flex}>
            <AppText variant="headlineSm" color={Palette.blueDark}>
              {feedbackSpeaking ? `${T.name} đang giảng` : `Lời ${T.word} nhận xét`}
            </AppText>
            <AppText variant="bodySm" color={Palette.blueDark}>
              Con lắng nghe giọng {T.word} nhé!
            </AppText>
          </View>
        </View>

        <View style={styles.quote}>
          <MaterialIcons name="record-voice-over" size={22} color={Palette.blue} />
          <AppText variant="bodyLg" style={styles.flex}>
            “{entry.spokenFeedback}”
          </AppText>
        </View>

        <SoundWave active={feedbackSpeaking} heights={waveHeights} colors={waveColors} gap={7} restHeight={8} style={styles.wave} />

        <View style={styles.voiceControls}>
          <RoundButton icon="replay" label="Nghe lại từ đầu" onPress={replay} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={feedbackSpeaking ? 'Dừng đọc' : `Nghe ${T.word} nhận xét`}
            onPress={toggleSpeech}
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
            <MaterialIcons name={feedbackSpeaking ? 'pause' : 'play-arrow'} size={40} color={Palette.white} />
          </Pressable>
          <View style={styles.roundButtonSpacer} />
        </View>
      </View>

      {entry.items.length > 0 && (
        <Card>
          <View style={styles.detailHeader}>
            <MaterialIcons name="menu-book" size={22} color={Palette.blue} />
            <AppText variant="headlineSm" style={styles.flex}>
              Chi tiết bài làm trên vở
            </AppText>
            <View style={styles.countTag}>
              <AppText variant="labelSm">{entry.items.length} câu</AppText>
            </View>
          </View>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Bấm nút loa để nghe {T.word} giảng lại, hoặc bấm Hỏi {T.word} nếu con còn thắc mắc nhé!
          </AppText>
          {entry.items.map((item, index) => {
            const speakProps = {
              speakingNow: speaking && activeItem === index,
              onSpeak: () => toggleItem(index),
              onAsk: () => {
                stopSpeech();
                openAskTeacher({ item, number: index + 1, subject: entry.subject, grade: entry.grade });
              },
            };
            if (item.correct) return <CorrectRow key={index} item={item} number={index + 1} {...speakProps} />;
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
                {...speakProps}
              />
            );
          })}
        </Card>
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

function CorrectRow({ item, number, speakingNow, onSpeak, onAsk }: RowProps) {
  return (
    <View style={[styles.row, { backgroundColor: Palette.surfaceMuted }]}>
      <View style={styles.rowHeader}>
        <NumberBubble number={number} tint={Palette.blueSoft} ink={Palette.blue} />
        <View style={styles.flex}>
          <AppText variant="labelLg">{item.question}</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            Con làm: {item.childAnswer}
          </AppText>
        </View>
        <ItemSpeakButton speakingNow={speakingNow} onSpeak={onSpeak} number={number} />
      </View>
      <View style={styles.rowActions}>
        <View style={styles.correctPill}>
          <MaterialIcons name="check-circle-outline" size={18} color={Palette.blueDark} />
          <AppText variant="labelMd" color={Palette.blueDark}>
            Đúng rồi! Giỏi quá
          </AppText>
        </View>
        <AskTeacherButton onPress={onAsk} />
      </View>
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
  const T = useTeacher();
  // Bé đang làm lại thì che đáp án đúng, để bé tự nghĩ.
  const [hideAnswer, setHideAnswer] = useState(false);
  return (
    <View style={[styles.row, { backgroundColor: Palette.coralSoft }]}>
      <View style={styles.rowHeader}>
        <NumberBubble number={number} tint={Palette.coral} ink={Palette.coralInk} />
        <View style={styles.flex}>
          <AppText variant="labelLg">{item.question}</AppText>
          <AppText variant="labelMd" color={Palette.coralDark}>
            Con viết: <AppText style={styles.strike}>{item.childAnswer}</AppText>
            {item.correctAnswer && !hideAnswer ? (
              <AppText variant="labelMd" color={Palette.blue}>
                {'  •  '}Đúng là: {item.correctAnswer}
              </AppText>
            ) : null}
          </AppText>
        </View>
        <ItemSpeakButton speakingNow={speakingNow} onSpeak={onSpeak} number={number} />
      </View>
      <View style={styles.rowActions}>
        <View style={styles.fixTag}>
          <MaterialIcons name="lightbulb-outline" size={16} color={Palette.coralInk} />
          <AppText variant="labelMd" color={Palette.coralInk}>
            Cùng {T.Title} sửa nha
          </AppText>
        </View>
        <AskTeacherButton onPress={onAsk} />
      </View>
      {!hideAnswer && (
        <View style={styles.explainBox}>
          <AppText variant="bodyMd">{item.explanation}</AppText>
        </View>
      )}
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
    alignItems: 'flex-start',
    gap: Spacing.three,
    backgroundColor: Palette.amber,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  heroText: {
    flex: 1,
    gap: Spacing.two,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  medal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceCard: {
    backgroundColor: Palette.mint,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quote: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  wave: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: Radius.full,
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonSpacer: {
    width: 52,
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  countTag: {
    backgroundColor: Palette.blueSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  correctPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  fixTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.coral,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
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
