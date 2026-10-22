import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { AskTeacherButton } from '@/components/ask-teacher-button';
import { Card } from '@/components/card';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { RetryQuestion } from '@/components/retry-question';
import { Screen } from '@/components/screen';
import { SoundWave } from '@/components/sound-wave';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames } from '@/lib/grading';
import { findHistoryEntry, type HistoryEntry } from '@/lib/history';
import { openAskTeacher } from '@/lib/hoi-co';
import { itemSpeech } from '@/lib/item-speech';
import { signedPageUrls } from '@/lib/page-images';
import { useTeacher } from '@/lib/profile';
import { SubjectIcons } from '@/lib/progress';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SpeakKey = 'feedback' | number | `retry-${number}`;

// Xem lại một lần chấm (từ lịch sử ở tab Tiến độ): ảnh các trang, điểm, từng câu, lời nhận xét.
export default function GradingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);
  const [remoteUris, setRemoteUris] = useState<string[]>([]);
  const T = useTeacher();
  // Đang đọc gì: 'feedback' (lời nhận xét chung), số thứ tự câu, "retry-<số>" (lời cô ở phần làm lại), hoặc null.
  const [speakingKey, setSpeakingKey] = useState<SpeakKey | null>(null);
  // Câu bé đang làm lại thì che đáp án đúng.
  const [hiddenAnswers, setHiddenAnswers] = useState<Record<number, boolean>>({});

  function startSpeak(key: SpeakKey, text: string) {
    setSpeakingKey(key);
    speakVietnamese(text, { onDone: () => setSpeakingKey((current) => (current === key ? null : current)) }, T.id);
  }

  function stopSpeak() {
    stopSpeaking();
    setSpeakingKey(null);
  }

  function toggleSpeak(key: SpeakKey, text: string) {
    if (speakingKey === key) stopSpeak();
    else startSpeak(key, text);
  }
  const { width } = useWindowDimensions();

  useEffect(() => {
    findHistoryEntry(id).then(setEntry);
    return stopSpeaking;
  }, [id]);

  // Ảnh trên máy nếu còn; không có (ví dụ xem trên máy khác) thì lấy từ kho Supabase.
  const localPages = entry?.pages ?? [];
  const imagePaths = localPages.length ? null : entry?.imagePaths;
  useEffect(() => {
    if (!imagePaths?.length) return;
    signedPageUrls(imagePaths)
      .then(setRemoteUris)
      .catch((error) => console.warn('Chưa tải được ảnh bài làm:', error));
  }, [imagePaths]);
  const pageUris = localPages.length ? localPages : remoteUris;

  if (entry === undefined) return <Screen>{null}</Screen>;

  const pageWidth = Math.min(width, 600) - Spacing.five * 2;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/tien-do'))}
          style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="headlineSm">
            {entry ? `${SubjectIcons[entry.subject]} ${SubjectNames[entry.subject]} · Lớp ${entry.grade}` : 'Bài chấm'}
          </AppText>
          {entry && (
            <AppText variant="bodySm" color={Palette.inkSoft}>
              {formatDate(entry.createdAt)}
            </AppText>
          )}
        </View>
      </View>

      {!entry ? (
        <Card>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Không tìm thấy bài chấm này trên máy.
          </AppText>
        </Card>
      ) : (
        <>
          <View style={styles.scoreRow}>
            <View style={styles.score}>
              <AppText variant="headlineXl" color={Palette.amberInk}>
                {entry.score}
              </AppText>
              <AppText variant="labelMd" color={Palette.amberInk}>
                /10 điểm
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelLg">
                Đúng {entry.items.filter((item) => item.correct).length}/{entry.items.length} câu
              </AppText>
              <AppText variant="bodySm" color={Palette.inkSoft}>
                {engineLabel(entry.engine)}
              </AppText>
            </View>
          </View>

          {pageUris.length > 0 && (
            <View style={styles.section}>
              <AppText variant="headlineSm">Ảnh bài làm ({pageUris.length} trang)</AppText>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {pageUris.map((uri, index) => (
                  <View key={uri} style={[styles.page, { width: pageWidth }]}>
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
                    <View style={styles.pageNumber}>
                      <AppText variant="labelSm" color={Palette.white}>
                        Trang {index + 1}/{pageUris.length}
                      </AppText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <Card>
            <AppText variant="headlineSm">Lời {T.word} nhận xét</AppText>
            <AppText variant="bodyLg">{entry.spokenFeedback}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => toggleSpeak('feedback', entry.spokenFeedback)}
              style={styles.listen}>
              <MaterialIcons name={speakingKey === 'feedback' ? 'stop' : 'volume-up'} size={22} color={Palette.blueDark} />
              <AppText variant="labelLg" color={Palette.blueDark}>
                {speakingKey === 'feedback' ? 'Dừng' : 'Nghe lại'}
              </AppText>
              <SoundWave
                active={speakingKey === 'feedback'}
                heights={[10, 18, 12, 20, 14]}
                colors={[Palette.blueDark]}
                barWidth={4}
                gap={4}
                restHeight={6}
              />
            </Pressable>
          </Card>

          <Card>
            <AppText variant="headlineSm">Từng câu</AppText>
            {entry.items.map((item, index) => (
              <View
                key={index}
                style={[styles.itemWrap, { backgroundColor: item.correct ? Palette.mintSoft : Palette.coralSoft }]}>
                <View style={styles.item}>
                  <MaterialIcons
                    name={item.correct ? 'check-circle-outline' : 'highlight-off'}
                    size={22}
                    color={item.correct ? Palette.blueDark : Palette.coralDark}
                  />
                  <View style={styles.flex}>
                    <AppText variant="labelLg">{item.question}</AppText>
                    <AppText variant="bodySm">
                      Bé làm: {item.childAnswer}
                      {!item.correct && item.correctAnswer && !hiddenAnswers[index]
                        ? ` · Đúng là: ${item.correctAnswer}`
                        : ''}
                    </AppText>
                    {!item.correct && !hiddenAnswers[index] && (
                      <AppText variant="bodySm" color={Palette.inkSoft}>
                        {item.explanation}
                      </AppText>
                    )}
                    <View style={styles.askRow}>
                      <AskTeacherButton
                        onPress={() => {
                          stopSpeaking();
                          setSpeakingKey(null);
                          openAskTeacher({ item, number: index + 1, subject: entry.subject, grade: entry.grade });
                        }}
                      />
                    </View>
                  </View>
                  <ItemSpeakButton
                    number={index + 1}
                    speakingNow={speakingKey === index}
                    onSpeak={() => toggleSpeak(index, itemSpeech(item, index + 1, T))}
                  />
                </View>
                {!item.correct && (
                  <RetryQuestion
                    item={item}
                    number={index + 1}
                    subject={entry.subject}
                    grade={entry.grade}
                    speakingNow={speakingKey === `retry-${index}`}
                    speak={(text) => startSpeak(`retry-${index}`, text)}
                    stopSpeech={stopSpeak}
                    onHideAnswer={(hide) => setHiddenAnswers((current) => ({ ...current, [index]: hide }))}
                  />
                )}
              </View>
            ))}
          </Card>

          <Card tint={Palette.amberSoft} borderColor={Palette.amberSoft}>
            <AppText variant="labelLg">Gợi ý cho ba mẹ</AppText>
            <AppText variant="bodyMd">{entry.parentNote}</AppText>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.amber,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  score: {
    alignItems: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  page: {
    aspectRatio: 3 / 4,
    marginRight: Spacing.three,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceMuted,
  },
  pageNumber: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: 'rgba(17,28,45,0.65)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  listen: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.mint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.two + 2,
  },
  askRow: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  itemWrap: {
    gap: Spacing.three,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
});

function engineLabel(engine?: string) {
  if (engine === 'local') return 'Chấm bằng AI trên máy tính ở nhà';
  if (engine === 'gemini') return 'Chấm bằng AI Gemini (bản thử)';
  return 'Chấm bằng AI trên máy chủ';
}
