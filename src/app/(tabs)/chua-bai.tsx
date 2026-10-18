import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type GradedItem } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { itemSpeech } from '@/lib/item-speech';
import { useTeacher } from '@/lib/profile';
import { praiseForScore } from '@/lib/progress';

const waveHeights = [14, 24, 18, 32, 22, 36, 26, 18, 30, 16, 24, 12, 20, 28];
const waveColors = [Palette.blue, Palette.amber, Palette.white, Palette.coral];

export default function ReviewScreen() {
  const { latest, startOver, speaking, speak, stopSpeech } = useHomeworkSession();
  const T = useTeacher();
  const [saved, setSaved] = useState<HistoryEntry | null>(null);
  // Câu đang được giảng lại (null = lời nhận xét chung).
  const [activeItem, setActiveItem] = useState<number | null>(null);
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

        <View style={styles.wave}>
          {waveHeights.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                { height: feedbackSpeaking ? height : 8, backgroundColor: waveColors[index % waveColors.length] },
              ]}
            />
          ))}
        </View>

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
            Bấm nút loa ở từng câu để nghe {T.word} giảng lại câu đó nhé!
          </AppText>
          {entry.items.map((item, index) => {
            const speakProps = {
              speakingNow: speaking && activeItem === index,
              onSpeak: () => toggleItem(index),
            };
            return item.correct ? (
              <CorrectRow key={index} item={item} number={index + 1} {...speakProps} />
            ) : (
              <WrongRow key={index} item={item} number={index + 1} {...speakProps} />
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
};

function CorrectRow({ item, number, speakingNow, onSpeak }: RowProps) {
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
      <View style={styles.correctPill}>
        <MaterialIcons name="check-circle-outline" size={18} color={Palette.blueDark} />
        <AppText variant="labelMd" color={Palette.blueDark}>
          Đúng rồi! Giỏi quá
        </AppText>
      </View>
    </View>
  );
}

function WrongRow({ item, number, speakingNow, onSpeak }: RowProps) {
  const T = useTeacher();
  return (
    <View style={[styles.row, { backgroundColor: Palette.coralSoft }]}>
      <View style={styles.rowHeader}>
        <NumberBubble number={number} tint={Palette.coral} ink={Palette.coralInk} />
        <View style={styles.flex}>
          <AppText variant="labelLg">{item.question}</AppText>
          <AppText variant="labelMd" color={Palette.coralDark}>
            Con viết: <AppText style={styles.strike}>{item.childAnswer}</AppText>
            {item.correctAnswer ? (
              <AppText variant="labelMd" color={Palette.blue}>
                {'  •  '}Đúng là: {item.correctAnswer}
              </AppText>
            ) : null}
          </AppText>
        </View>
        <ItemSpeakButton speakingNow={speakingNow} onSpeak={onSpeak} number={number} />
      </View>
      <View style={styles.fixTag}>
        <MaterialIcons name="lightbulb-outline" size={16} color={Palette.coralInk} />
        <AppText variant="labelMd" color={Palette.coralInk}>
          Cùng {T.Title} sửa nha
        </AppText>
      </View>
      <View style={styles.explainBox}>
        <AppText variant="bodyMd">{item.explanation}</AppText>
      </View>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: Radius.full,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
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
  correctPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  fixTag: {
    alignSelf: 'flex-start',
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
