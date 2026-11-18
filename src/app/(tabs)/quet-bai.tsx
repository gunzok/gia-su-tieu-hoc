import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { ChoiceChips } from '@/components/choice-chips';
import { GradingOverlay } from '@/components/grading-overlay';
import { Screen } from '@/components/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames } from '@/lib/grading';
import { MAX_PAGES, useHomeworkSession } from '@/lib/homework-session';
import { useTeacher } from '@/lib/profile';
import { allSubjects } from '@/lib/progress';

const grades = [1, 2, 3, 4, 5];
const subjectOptions = allSubjects.map((s) => ({
  value: s,
  label: SubjectNames[s],
}));

export default function ScanScreen() {
  const { grade, setGrade, subject, setSubject, photos, removePhoto, grading, pickPhoto, submitForGrading } =
    useHomeworkSession();
  const count = photos.length;
  const full = count >= MAX_PAGES;
  const T = useTeacher();

  async function handleGrade() {
    const done = await submitForGrading();
    if (done) router.navigate('/chua-bai');
  }

  return (
    <Screen
      footer={
        count > 0 ? (
          <BigButton
            label={count > 1 ? `${T.Title} chấm ${count} trang nhé!` : `${T.Title} chấm bài nhé!`}
            icon="auto-fix-high"
            onPress={handleGrade}
            loading={grading}
          />
        ) : null
      }>
      <AppText variant="headlineLg">Chụp bài</AppText>

      <View style={styles.pickers}>
        <ChoiceChips options={subjectOptions} value={subject} onChange={setSubject} />
        <View style={styles.gradeRow}>
          <AppText variant="labelLg" color={Palette.inkSoft}>
            Lớp
          </AppText>
          {grades.map((g) => {
            const selected = g === grade;
            return (
              <Pressable
                key={g}
                accessibilityRole="button"
                accessibilityLabel={`Lớp ${g}`}
                accessibilityState={{ selected }}
                onPress={() => setGrade(g)}
                style={({ pressed }) => [
                  styles.gradeButton,
                  { backgroundColor: selected ? Palette.mint : Palette.surfaceMuted },
                  pressed && styles.pressed,
                ]}>
                <AppText variant="headlineSm" color={selected ? Palette.blueDark : Palette.ink}>
                  {g}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.frame}>
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />

        <View style={styles.statusPill}>
          <MaterialIcons name={count ? 'check-circle-outline' : 'center-focus-weak'} size={18} color={Palette.white} />
          <AppText variant="labelMd" color={Palette.white}>
            {count ? `Đã có ${count}/${MAX_PAGES} trang vở` : 'Đặt vở vào khung nhé'}
          </AppText>
        </View>

        <View style={styles.paper}>
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

        <View style={styles.tips}>
          <Tip icon="light-mode" label="Đủ ánh sáng" />
          <Tip icon="crop-free" label="Chụp thẳng" />
        </View>
      </View>

      <View style={styles.controls}>
        <SideControl icon="photo-library" label="Từ Album" onPress={() => pickPhoto('library')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={full ? 'Đủ trang' : count ? 'Chụp thêm trang' : 'Chụp ngay'}
          disabled={full}
          onPress={() => pickPhoto('camera')}
          style={({ pressed }) => [styles.shutterRing, full && styles.disabled, pressed && styles.pressed]}>
          <View style={styles.shutter}>
            <MaterialIcons name="photo-camera" size={36} color={Palette.blueDark} />
          </View>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbs}
          contentContainerStyle={styles.thumbsContent}>
          {photos.map((page, index) => (
            <View key={`${page.uri}-${index}`} style={styles.thumb}>
              <Image source={{ uri: page.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.thumbNumber}>
                <AppText variant="labelSm" color={Palette.white}>
                  {index + 1}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Bỏ trang ${index + 1}`}
                onPress={() => removePhoto(index)}
                style={styles.thumbRemove}>
                <View style={styles.thumbRemoveDot}>
                  <MaterialIcons name="close" size={16} color={Palette.white} />
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      {grading && <GradingOverlay photoUri={photos[0]?.uri} pageCount={count} />}
    </Screen>
  );
}

function SideControl({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <MaterialIcons name={icon} size={18} color={Palette.white} />
      <AppText variant="labelMd" color={Palette.white}>
        {label}
      </AppText>
    </View>
  );
}

const CORNER = 28;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
  pickers: {
    gap: Spacing.two + 4,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gradeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
    // Khung thấp vừa đủ để hàng nút chụp và ảnh đã chụp nằm trên nút "Cô chấm" dính đáy, không phải cuộn.
    aspectRatio: 1.2,
    borderRadius: Radius.lg,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: Palette.mint,
  },
  cornerTopLeft: {
    top: Spacing.three,
    left: Spacing.three,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: Spacing.three,
    right: Spacing.three,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: Spacing.three,
    left: Spacing.three,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: Spacing.three,
    right: Spacing.three,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  statusPill: {
    position: 'absolute',
    top: Spacing.three + 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  paper: {
    width: '62%',
    aspectRatio: 1.3,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two + 4,
    transform: [{ rotate: '-3deg' }],
  },
  placeholderLineShort: {
    width: '45%',
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.border,
  },
  placeholderLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.border,
  },
  placeholderMark: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.amber,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 6,
  },
  tips: {
    position: 'absolute',
    bottom: Spacing.four + 4,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sideControl: {
    flex: 1,
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
  shutterRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: Palette.mint,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbs: {
    flex: 1,
  },
  thumbsContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.one,
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  thumbNumber: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    minWidth: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(17,28,45,0.75)',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  // Vùng bấm 44pt phủ góc trên ảnh nhỏ; chấm ✕ nhìn thấy nằm ở góc.
  thumbRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    padding: 3,
  },
  thumbRemoveDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17,28,45,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
