import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { PulseRing, SoundWave } from '@/components/sound-wave';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type Subject } from '@/lib/grading';
import { useGreeting } from '@/lib/greetings';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { useHomeworkSession } from '@/lib/homework-session';
import { useProfile, useTeacher } from '@/lib/profile';
import { allSubjects, averageScore } from '@/lib/progress';
import { currentStreak, streakMessage } from '@/lib/rewards';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';
import { Columns } from '@/web/columns';
import { DropZone } from '@/web/drop-zone';
import { Screen } from '@/web/screen';
import { useIsDesktop } from '@/web/use-layout';


const subjectStyles: Record<Subject, { tint: string; dot: string; ink: string; icon: IconName; hint: string }> = {
  toan: { tint: Palette.mintSoft, dot: Palette.blue, ink: Palette.blueDark, icon: 'calculate', hint: 'Số & Hình' },
  'tieng-viet': {
    tint: Palette.coralSoft,
    dot: Palette.coralInk,
    ink: Palette.coralInk,
    icon: 'spellcheck',
    hint: 'Đọc & Viết',
  },
};

export default function HomeScreen() {
  const { grade, subject, setSubject, pickPhoto, addPhotos } = useHomeworkSession();
  const desktop = useIsDesktop();
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

  function startSubject(next: Subject) {
    setSubject(next);
    router.navigate('/quet-bai');
  }

  // Máy tính: thả ảnh hoặc chọn ảnh ngay ở Trang chủ rồi sang màn Quét bài để chấm.
  async function handleDroppedPhotos(assets: ImagePickerAsset[]) {
    await addPhotos(assets);
    router.navigate('/quet-bai');
  }

  async function pickFromComputer() {
    await pickPhoto('library');
    router.navigate('/quet-bai');
  }

  const streakCard = (
    <View accessible accessibilityLabel={`Chuỗi ${streak} ngày học. ${streakMessage(rewards, now)}`} style={styles.streakRow}>
      <View style={styles.streakBadge}>
        <AppText style={styles.streakIcon}>🔥</AppText>
        <AppText variant="headlineSm" color={Palette.coralInk}>
          {streak}
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText variant="labelLg" color={Palette.coralInk}>
          Chuỗi {streak} ngày học
        </AppText>
        <AppText variant="bodySm" color={Palette.coralInk}>
          {streakMessage(rewards, now)}
        </AppText>
      </View>
    </View>
  );

  const greetingCard = (
    <Card style={styles.greetingCard}>
      {desktop && (
        <View style={styles.classTag}>
          <View style={styles.classDot} />
          <AppText variant="labelSm" color={Palette.inkSoft}>
            Lớp {grade} • {SubjectNames[subject]}
          </AppText>
        </View>
      )}
      <View style={styles.greetingRow}>
        <Mascot variant="full" size={desktop ? 150 : 96} />
        <View style={[styles.bubble, desktop && styles.bubbleDesktop]}>
          <AppText variant={desktop ? 'headlineMd' : 'labelLg'} color={Palette.blueDark}>
            {greeting.title}
          </AppText>
          <AppText variant={desktop ? 'bodyLg' : 'bodyMd'}>{greeting.body}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={speaking ? 'Dừng đọc' : `Nghe ${T.word} dặn hôm nay`}
        onPress={toggleGreeting}
        style={({ pressed }) => [styles.listenButton, speaking && styles.listenActive, pressed && styles.pressed]}>
        <View style={styles.listenIcon}>
          <PulseRing active={speaking} size={30} color={Palette.blueDark} />
          <MaterialIcons name={speaking ? 'stop' : 'volume-up'} size={22} color={Palette.blueDark} />
        </View>
        <AppText variant="labelLg" color={Palette.blueDark} style={styles.flex}>
          {speaking ? `${T.Title} đang nói…` : `Nghe ${T.Title} dặn hôm nay`}
        </AppText>
        <SoundWave
          active={speaking}
          heights={[10, 18, 12, 22, 14]}
          colors={[Palette.blueDark]}
          barWidth={4}
          gap={4}
          restHeight={10}
        />
      </Pressable>
    </Card>
  );

  const heroCard = (
    <View style={[styles.hero, desktop && styles.heroDesktop]}>
      {!desktop && (
        <View style={styles.heroIcon}>
          <MaterialIcons name="photo-camera" size={30} color={Palette.blue} />
        </View>
      )}
      <View style={styles.heroTag}>
        <AppText variant="labelSm" color={Palette.ink}>
          TRỢ THỦ AI THÔNG MINH
        </AppText>
      </View>
      <AppText variant="headlineLg" style={desktop ? undefined : styles.center}>
        Chấm bài cùng {T.Title} ngay!
      </AppText>
      <AppText variant="bodyMd" color={Palette.inkSoft} style={desktop ? undefined : styles.center}>
        Chỉ 1 bức ảnh, {T.Title} sẽ sửa lỗi sai và giảng lại cho con nghe ngay.
      </AppText>
      {desktop && (
        <DropZone onAssets={handleDroppedPhotos} style={styles.dropBox} overStyle={styles.dropBoxOver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chọn ảnh bài tập từ máy tính"
            onPress={pickFromComputer}
            style={({ pressed }) => [styles.dropInner, pressed && styles.pressed]}>
            <View style={styles.dropIcon}>
              <MaterialIcons name="add-a-photo" size={30} color={Palette.amberInk} />
            </View>
            <View style={styles.flex}>
              <AppText variant="labelLg">Kéo ảnh bài tập vào đây</AppText>
              <AppText variant="bodySm" color={Palette.inkSoft}>
                Hoặc bấm để chọn ảnh vở viết tay, sách bài tập, phiếu bài
              </AppText>
            </View>
          </Pressable>
        </DropZone>
      )}
      <BigButton
        label={desktop ? 'Tải ảnh bài tập lên ngay 🚀' : 'Chụp bài tập 📸'}
        icon={desktop ? 'upload-file' : 'camera'}
        onPress={() => router.navigate('/quet-bai')}
      />
    </View>
  );

  const subjectsSection = (
    <View style={styles.section}>
      <AppText variant="headlineSm">Môn học vui vẻ</AppText>
      <View style={styles.subjectRow}>
        {allSubjects.map((subject) => {
          const look = subjectStyles[subject];
          const average = averageScore(history.filter((entry) => entry.subject === subject));
          return (
            <Pressable
              key={subject}
              accessibilityRole="button"
              onPress={() => startSubject(subject)}
              style={({ pressed }) => [styles.subjectTile, { backgroundColor: look.tint }, pressed && styles.pressed]}>
              <View style={[styles.subjectIcon, { backgroundColor: look.dot }]}>
                <MaterialIcons name={look.icon} size={28} color={Palette.white} />
              </View>
              <AppText variant="labelLg" color={look.ink}>
                {SubjectNames[subject]} {grade}
              </AppText>
              <AppText variant="bodySm" color={look.ink}>
                {average === null ? look.hint : `Điểm TB ${average.toFixed(1)}`}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const latestCard = history[0] && (
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
          BÀI GẦN NHẤT
        </AppText>
        <AppText variant="labelLg">
          {SubjectNames[history[0].subject]} lớp {history[0].grade}
        </AppText>
      </View>
      <BigButton label="Xem lại" compact variant="ghost" onPress={() => router.navigate('/chua-bai')} />
    </Card>
  );

  const parentRow = (
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
  );

  // Cửa sổ hẹp thì Columns tự xếp dọc: lời chào, chấm bài, môn học, bài gần nhất, chuỗi ngày, góc phụ huynh.
  return (
    <Screen>
      <Columns ratio={1.25} main={greetingCard} aside={heroCard} />
      <Columns
        ratio={1.6}
        main={
          <>
            {subjectsSection}
            {latestCard}
          </>
        }
        aside={
          <>
            {streakCard}
            {parentRow}
          </>
        }
      />
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.coralSoft,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  streakIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  greetingCard: {
    gap: Spacing.three,
  },
  classTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.surfaceStrong,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  classDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.blue,
  },
  bubbleDesktop: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroDesktop: {
    alignItems: 'stretch',
    padding: Spacing.four + 4,
    gap: Spacing.three,
  },
  dropBox: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.mint,
    backgroundColor: Palette.surface,
  },
  dropBoxOver: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mintSoft,
  },
  dropInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three + 4,
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bubble: {
    flex: 1,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md + 4,
    borderTopLeftRadius: 4,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.mint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.four,
    minHeight: 52,
  },
  listenActive: {
    backgroundColor: Palette.mintSoft,
  },
  listenIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: Palette.surfaceStrong,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two + 2,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTag: {
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.three,
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
  subjectTile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
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
    marginBottom: Spacing.one,
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
