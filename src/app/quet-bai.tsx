import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { ChoiceChips } from '@/components/choice-chips';
import { GradingOverlay } from '@/components/grading-overlay';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames } from '@/lib/grading';
import { useHomeworkSession } from '@/lib/homework-session';
import { allSubjects, SubjectIcons } from '@/lib/progress';

const gradeOptions = [1, 2, 3, 4, 5].map((g) => ({ value: g, label: `Lớp ${g}` }));
const subjectOptions = allSubjects.map((s) => ({
  value: s,
  label: `${SubjectIcons[s]} ${SubjectNames[s]}`,
}));

export default function ScanScreen() {
  const { grade, setGrade, subject, setSubject, photo, grading, pickPhoto, submitForGrading } =
    useHomeworkSession();

  async function handleGrade() {
    const done = await submitForGrading();
    if (done) router.navigate('/chua-bai');
  }

  return (
    <Screen>
      <AppHeader subtitle="Quét bài" />

      <View style={styles.pickers}>
        <ChoiceChips options={subjectOptions} value={subject} onChange={setSubject} />
        <ChoiceChips options={gradeOptions} value={grade} onChange={setGrade} />
      </View>

      <View style={styles.frame}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <AppText style={styles.placeholderEmoji}>📒</AppText>
            <AppText variant="bodyLg" color={Palette.white} style={styles.center}>
              Đặt vở vào khung rồi bấm “Chụp ngay” nhé!
            </AppText>
          </View>
        )}
        <View pointerEvents="none" style={styles.scanBorder} />
        {photo && (
          <View style={styles.capturedBadge}>
            <AppText variant="labelMd" color={Palette.white}>
              ✓ Đã chụp xong! 📸
            </AppText>
          </View>
        )}
        <View style={styles.bubbleRow}>
          <Mascot size={44} />
          <View style={styles.bubble}>
            <AppText variant="labelMd">Chụp rõ nét con nhé! ✨</AppText>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <SideControl icon="🖼️" label="Album" onPress={() => pickPhoto('library')} />
        <View style={styles.shutterColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo ? 'Chụp lại' : 'Chụp ngay'}
            onPress={() => pickPhoto('camera')}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutter,
                  { borderBottomWidth: pressed ? 2 : 7, transform: [{ translateY: pressed ? 4 : 0 }] },
                ]}>
                <AppText style={styles.shutterEmoji}>📷</AppText>
              </View>
            )}
          </Pressable>
          <AppText variant="labelLg" color={Palette.amberInk}>
            {photo ? 'Chụp lại' : 'Chụp ngay'}
          </AppText>
        </View>
        <View style={styles.sideControl} />
      </View>

      {photo && (
        <BigButton label="✏️  Cô chấm bài nhé!" variant="mint" onPress={handleGrade} loading={grading} />
      )}
      {grading && <GradingOverlay photoUri={photo?.uri} />}

      <View style={styles.tips}>
        <Tip icon="💡" label="Đủ ánh sáng" />
        <Tip icon="📐" label="Chụp thẳng góc" />
      </View>
    </Screen>
  );
}

function SideControl({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.sideControl}>
      <View style={styles.sideCircle}>
        <AppText style={styles.sideEmoji}>{icon}</AppText>
      </View>
      <AppText variant="labelMd">{label}</AppText>
    </Pressable>
  );
}

function Tip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.tip}>
      <AppText style={styles.tipEmoji}>{icon}</AppText>
      <AppText variant="labelMd">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  pickers: {
    gap: Spacing.two,
  },
  frame: {
    // Khung thấp vừa đủ để nút "Chụp ngay" luôn nằm trong màn hình, không phải cuộn.
    aspectRatio: 1.1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  placeholderEmoji: {
    fontSize: 72,
    lineHeight: 84,
  },
  scanBorder: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#4EDEA3',
    borderRadius: Radius.md,
  },
  capturedBadge: {
    position: 'absolute',
    top: Spacing.three,
    alignSelf: 'center',
    backgroundColor: Palette.mintDark,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  bubbleRow: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bubble: {
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  sideControl: {
    width: 72,
    alignItems: 'center',
    gap: Spacing.one,
  },
  sideCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  shutterColumn: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  shutter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Palette.amber,
    borderColor: Palette.amberDark,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.amber,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  shutterEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  tips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  tipEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
});
