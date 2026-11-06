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
import { useLayout } from '@/web/use-layout';

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

function dayPart(hour: number) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function HomeScreen() {
  const { grade, setSubject, pickPhoto, addPhotos } = useHomeworkSession();
  const { profile, rewards } = useProfile();
  const { wide, narrow } = useLayout();
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

  // Thả ảnh hoặc chọn ảnh ngay ở Trang chủ rồi sang màn Quét bài để chấm.
  async function handleDroppedPhotos(assets: ImagePickerAsset[]) {
    await addPhotos(assets);
    router.navigate('/quet-bai');
  }

  async function pickFromComputer() {
    await pickPhoto('library');
    router.navigate('/quet-bai');
  }

  const heroText = (
    <View style={styles.heroText}>
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: Palette.amberSoft }]}>
          <MaterialIcons name="wb-sunny" size={16} color={Palette.amberInk} />
          <AppText variant="labelSm" color={Palette.amberInk}>
            {dayPart(now.getHours())}
          </AppText>
        </View>
        {streak > 0 && (
          <View style={[styles.tag, { backgroundColor: Palette.coralSoft }]}>
            <AppText variant="labelSm" color={Palette.coralInk}>
              🔥 {streak} ngày chăm chỉ liên tiếp!
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="headlineXl" style={wide ? styles.heroTitleWide : undefined}>
        Xin chào <AppText variant="headlineXl" color={Palette.blue} style={wide ? styles.heroTitleWide : undefined}>
          Bé {profile?.name || 'yêu'}!
        </AppText>{' '}
        👋
      </AppText>
      <AppText variant="bodyLg" color={Palette.inkSoft}>
        {greeting.title} {greeting.body}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={speaking ? 'Dừng đọc' : `Nghe ${T.word} dặn hôm nay`}
        onPress={toggleGreeting}
        style={({ pressed }) => [styles.listen, pressed && styles.pressed]}>
        <View style={[styles.listenIcon, speaking && { backgroundColor: Palette.mint }]}>
          <PulseRing active={speaking} size={30} color={Palette.blueDark} />
          <MaterialIcons name={speaking ? 'stop' : 'volume-up'} size={22} color={speaking ? Palette.blueDark : Palette.white} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg" color={Palette.blueDark}>
            {speaking ? `${T.Title} đang nói…` : `Lời nhắn từ ${T.Title}`}
          </AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {speaking ? 'Bấm để dừng' : `Bấm nghe ${T.word} dặn hôm nay nha`}
          </AppText>
        </View>
        <SoundWave
          active={speaking}
          heights={[10, 18, 12, 22, 14, 20]}
          colors={[Palette.blueDark]}
          barWidth={4}
          gap={4}
          restHeight={10}
        />
      </Pressable>

      <View style={styles.ctaRow}>
        <View style={styles.ctaMain}>
          <BigButton label={`Chấm bài cùng ${T.Title} ngay`} icon="document-scanner" onPress={() => router.navigate('/quet-bai')} />
        </View>
        {history[0] && !narrow && (
          <BigButton label="Xem bài vừa chấm" icon="auto-fix-high" variant="ghost" onPress={() => router.navigate('/chua-bai')} />
        )}
      </View>
    </View>
  );

  const heroArt = (
    <View style={[styles.art, !wide && styles.artMedium, narrow && styles.artNarrow]}>
      <View style={[styles.artBlob, !wide && styles.artBlobMedium]} />
      <Mascot variant="full" size={narrow ? 150 : wide ? 280 : 190} />
      <View style={styles.artBadge}>
        <MaterialIcons name="auto-awesome" size={16} color={Palette.blue} />
        <AppText variant="labelSm" color={Palette.blueDark}>
          {T.Title} sẵn sàng hỗ trợ {profile?.name ? 'bé' : 'con'}!
        </AppText>
      </View>
    </View>
  );

  const heroCard = (
    <View style={[styles.hero, narrow && styles.heroNarrow]}>
      {narrow ? (
        <>
          {heroArt}
          {heroText}
        </>
      ) : (
        <>
          <View style={styles.flex}>{heroText}</View>
          {heroArt}
        </>
      )}
    </View>
  );

  const dropCard = (
    <DropZone onAssets={handleDroppedPhotos} style={styles.dropBox} overStyle={styles.dropBoxOver}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chọn ảnh bài tập từ máy tính"
        onPress={pickFromComputer}
        style={({ pressed }) => [styles.dropInner, narrow && styles.dropInnerNarrow, pressed && styles.pressed]}>
        <View style={styles.dropIcon}>
          <MaterialIcons name="add-a-photo" size={32} color={Palette.amberInk} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineSm">Kéo ảnh bài tập vào đây</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Hoặc bấm để chọn ảnh vở viết tay, sách bài tập, phiếu bài. {T.Title} sẽ chấm và giảng lại ngay.
          </AppText>
        </View>
        {!narrow && <MaterialIcons name="arrow-forward" size={28} color={Palette.blue} />}
      </Pressable>
    </DropZone>
  );

  const subjectsSection = (
    <View style={styles.section}>
      <AppText variant="headlineSm">Môn học vui vẻ · Lớp {grade}</AppText>
      <View style={styles.subjectRow}>
        {allSubjects.map((subject) => {
          const look = subjectStyles[subject];
          const entries = history.filter((entry) => entry.subject === subject);
          const average = averageScore(entries);
          return (
            <Pressable
              key={subject}
              accessibilityRole="button"
              onPress={() => startSubject(subject)}
              style={({ pressed }) => [styles.subjectTile, { backgroundColor: look.tint }, pressed && styles.pressed]}>
              <View style={[styles.subjectIcon, { backgroundColor: look.dot }]}>
                <MaterialIcons name={look.icon} size={28} color={Palette.white} />
              </View>
              <AppText variant="headlineSm" color={look.ink}>
                {SubjectNames[subject]} {grade}
              </AppText>
              <AppText variant="bodySm" color={look.ink}>
                {average === null ? look.hint : `${entries.length} bài đã chấm`}
              </AppText>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(average ?? 0) * 10}%`, backgroundColor: look.dot }]} />
              </View>
              <AppText variant="labelSm" color={look.ink}>
                {average === null ? 'Chưa có bài' : `Điểm TB ${average.toFixed(1)}`}
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
        <AppText variant="headlineXl" color={Palette.amberInk}>
          {history[0].score}
        </AppText>
        <AppText variant="labelMd" color={Palette.amberInk}>
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

  return (
    <Screen>
      {heroCard}
      <Columns
        ratio={1.6}
        main={
          <>
            {dropCard}
            {subjectsSection}
          </>
        }
        aside={
          <>
            {latestCard}
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg + 8,
    padding: Spacing.five,
    overflow: 'hidden',
  },
  heroNarrow: {
    flexDirection: 'column',
    padding: Spacing.three + 4,
    gap: Spacing.three,
  },
  heroText: {
    gap: Spacing.three,
  },
  heroTitleWide: {
    fontSize: 44,
    lineHeight: 56,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  listen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  listenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaMain: {
    flexGrow: 1,
    flexBasis: 240,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  art: {
    width: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  artMedium: {
    width: 230,
  },
  artBlobMedium: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  artNarrow: {
    width: '100%',
  },
  artBlob: {
    position: 'absolute',
    top: 10,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Palette.mintSoft,
  },
  artBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.border,
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
    padding: Spacing.four,
  },
  dropInnerNarrow: {
    padding: Spacing.three + 4,
  },
  dropIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: Spacing.one + 2,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.coralSoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
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
