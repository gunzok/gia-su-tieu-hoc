import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
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

      <View style={styles.stage}>
        <View style={styles.statusPill}>
          <MaterialIcons
            name={photo ? 'check-circle-outline' : 'center-focus-weak'}
            size={18}
            color={Palette.blue}
          />
          <AppText variant="labelMd">{photo ? 'Đã chụp trang vở của con! 📸' : 'Đặt vở vào khung nhé'}</AppText>
        </View>

        <View style={styles.frame}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderLineShort} />
              <View style={styles.placeholderLine} />
              <View style={styles.placeholderLine} />
              <View style={styles.placeholderMark}>
                <AppText variant="labelMd" color={Palette.amberInk}>
                  12 + 15 = 27
                </AppText>
              </View>
              <View style={styles.placeholderLine} />
            </View>
          )}
        </View>

        <View style={styles.tips}>
          <Tip icon="light-mode" label="Đủ ánh sáng" />
          <Tip icon="crop-free" label="Chụp thẳng đứng" />
        </View>
      </View>

      <View style={styles.controls}>
        <SideControl icon="photo-library" label="Từ Album" onPress={() => pickPhoto('library')} />
        <View style={styles.shutterColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo ? 'Chụp lại' : 'Chụp ngay'}
            onPress={() => pickPhoto('camera')}
            style={({ pressed }) => [styles.shutterRing, pressed && styles.pressed]}>
            <View style={styles.shutter}>
              <MaterialIcons name="photo-camera" size={38} color={Palette.blueDark} />
            </View>
          </Pressable>
          <AppText variant="labelMd">{photo ? 'Chụp lại' : 'Chụp ngay'}</AppText>
        </View>
        <View style={styles.sideControl} />
      </View>

      {photo && <BigButton label="Cô chấm bài nhé!" icon="auto-fix-high" onPress={handleGrade} loading={grading} />}
      <View style={styles.teacherRow}>
        <Mascot size={64} />
        <View style={styles.bubble}>
          <AppText variant="labelMd" color={Palette.blue}>
            Cô Giáo Nhí ♡
          </AppText>
          <AppText variant="bodyMd">Con chụp ngay ngắn và đủ sáng để Cô chấm bài thật nhanh nhé! 🌸</AppText>
        </View>
      </View>

      {grading && <GradingOverlay photoUri={photo?.uri} />}
    </Screen>
  );
}

function SideControl({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}>
      <View style={styles.sideCircle}>
        <MaterialIcons name={icon} size={26} color={Palette.coralInk} />
      </View>
      <AppText variant="labelMd">{label}</AppText>
    </Pressable>
  );
}

function Tip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.tip}>
      <MaterialIcons name={icon} size={16} color={Palette.amberInk} />
      <AppText variant="labelMd">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  pickers: {
    gap: Spacing.two,
  },
  stage: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg + 8,
    padding: Spacing.three,
    gap: Spacing.two + 4,
    alignItems: 'center',
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  frame: {
    width: '100%',
    // Khung thấp vừa đủ để nút "Chụp ngay" luôn nằm trong màn hình, không phải cuộn.
    aspectRatio: 1.5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.blue,
  },
  placeholder: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  placeholderLineShort: {
    width: '35%',
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.mintSoft,
  },
  placeholderLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.blueSoft,
  },
  placeholderMark: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 6,
  },
  tips: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  bubble: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md + 4,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  sideControl: {
    width: 84,
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  sideCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterColumn: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  shutterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.mint,
    borderWidth: 4,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
