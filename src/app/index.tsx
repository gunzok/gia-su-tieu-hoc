import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { ChoiceChips } from '@/components/choice-chips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { gradeHomework, SubjectNames, type GradingResult, type Subject } from '@/lib/grading';
import { addHistoryEntry } from '@/lib/history';

const gradeOptions = [1, 2, 3, 4, 5].map((g) => ({ value: g, label: `Lớp ${g}` }));
const subjectOptions = (Object.keys(SubjectNames) as Subject[]).map((s) => ({
  value: s,
  label: SubjectNames[s],
}));

function speakVietnamese(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'vi-VN', rate: 0.9 });
}

export default function HomeworkScreen() {
  const [grade, setGrade] = useState(2);
  const [subject, setSubject] = useState<Subject>('toan');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);

  useEffect(() => () => void Speech.stop(), []);

  async function pickPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Bố mẹ hãy cho phép app dùng camera hoặc thư viện ảnh nhé.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;

    Speech.stop();
    setResult(null);
    setPhoto(picked.assets[0]);
  }

  async function submitForGrading() {
    if (!photo?.base64) return;
    setGrading(true);
    try {
      const graded = await gradeHomework({ imageBase64: photo.base64, subject, grade });
      setResult(graded);
      speakVietnamese(graded.spokenFeedback);
      await addHistoryEntry({
        ...graded,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        subject,
        grade,
      });
    } catch (error) {
      Alert.alert('Chưa chấm được bài', error instanceof Error ? error.message : String(error));
    } finally {
      setGrading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Cô giáo AI 🍎</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.lead}>
            Con chụp bài tập đã làm, cô sẽ chấm và nhận xét cho con nghe nhé!
          </ThemedText>

          <View style={styles.section}>
            <ThemedText type="smallBold">Con học lớp mấy?</ThemedText>
            <ChoiceChips options={gradeOptions} value={grade} onChange={setGrade} />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Bài tập môn gì?</ThemedText>
            <ChoiceChips options={subjectOptions} value={subject} onChange={setSubject} />
          </View>

          {photo && (
            <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="contain" />
          )}

          <View style={styles.buttons}>
            <BigButton
              label={photo ? '📷 Chụp lại' : '📷 Chụp bài làm'}
              variant={photo ? 'secondary' : 'primary'}
              onPress={() => pickPhoto('camera')}
            />
            <BigButton label="🖼️ Chọn ảnh có sẵn" variant="secondary" onPress={() => pickPhoto('library')} />
            {photo && !result && (
              <BigButton label="✏️ Cô chấm bài nhé!" onPress={submitForGrading} loading={grading} />
            )}
          </View>

          {grading && (
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Cô đang xem bài của con, đợi cô một chút nhé…
            </ThemedText>
          )}

          {result && <ResultCard result={result} />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ResultCard({ result }: { result: GradingResult }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.scoreBadge}>
        <ThemedText style={styles.scoreText}>{result.score}</ThemedText>
        <ThemedText style={styles.scoreMax}>/10</ThemedText>
      </View>

      <ThemedText style={styles.feedback}>{result.spokenFeedback}</ThemedText>
      <BigButton label="🔊 Nghe cô nhận xét" variant="secondary" onPress={() => speakVietnamese(result.spokenFeedback)} />

      {result.items.map((item, index) => (
        <View key={index} style={styles.item}>
          <ThemedText style={[styles.mark, { color: item.correct ? Accent.correct : Accent.wrong }]}>
            {item.correct ? '✓' : '✗'}
          </ThemedText>
          <View style={styles.itemBody}>
            <ThemedText type="smallBold">{item.question}</ThemedText>
            <ThemedText type="small">Con làm: {item.childAnswer}</ThemedText>
            {!item.correct && (
              <ThemedText type="small" themeColor="textSecondary">
                {item.explanation}
              </ThemedText>
            )}
          </View>
        </View>
      ))}
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
    gap: Spacing.four,
  },
  lead: {
    fontSize: 18,
    lineHeight: 26,
  },
  section: {
    gap: Spacing.two,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
  },
  buttons: {
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'center',
  },
  scoreText: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: 800,
    color: Accent.primary,
  },
  scoreMax: {
    fontSize: 24,
    fontWeight: 700,
    color: Accent.primary,
  },
  feedback: {
    fontSize: 18,
    lineHeight: 28,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  mark: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 800,
  },
  itemBody: {
    flex: 1,
    gap: Spacing.half,
  },
});
