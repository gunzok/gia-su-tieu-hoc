import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { ChoiceChips } from '@/components/choice-chips';
import { GradingOverlay } from '@/components/grading-overlay';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames } from '@/lib/grading';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import { MAX_PAGES, useHomeworkSession } from '@/lib/homework-session';
import { useTeacher } from '@/lib/profile';
import { allSubjects, SubjectIcons } from '@/lib/progress';
import { STARS_PER_GRADING } from '@/lib/rewards';
import { Columns } from '@/web/columns';
import { DropZone } from '@/web/drop-zone';
import { Screen } from '@/web/screen';
import { useLayout } from '@/web/use-layout';

const gradeOptions = [1, 2, 3, 4, 5].map((g) => ({
  value: g,
  label: `Lớp ${g}`,
}));
const subjectOptions = allSubjects.map((s) => ({
  value: s,
  label: `${SubjectIcons[s]} ${SubjectNames[s]}`,
}));

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ScanScreen() {
  const { grade, setGrade, subject, setSubject, photos, removePhoto, grading, pickPhoto, addPhotos, submitForGrading } =
    useHomeworkSession();
  const count = photos.length;
  const full = count >= MAX_PAGES;
  const T = useTeacher();
  const { wide, narrow } = useLayout();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Trang đang xem to ở khung xem trước.
  const [active, setActive] = useState(0);
  const shown = Math.min(active, Math.max(count - 1, 0));

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  async function handleGrade() {
    const done = await submitForGrading();
    if (done) router.navigate('/chua-bai');
  }

  const today = new Date().toDateString();
  const doneToday = history.filter((entry) => new Date(entry.createdAt).toDateString() === today).length;

  const header = (
    <View style={[styles.header, narrow && styles.headerNarrow]}>
      <View style={styles.headerTitle}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="document-scanner" size={28} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineMd">Tải lên & chấm bài</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            {T.Title} đọc bài, chấm điểm và giảng lại từng câu cho con.
          </AppText>
        </View>
      </View>
      <View style={styles.todayPill}>
        <MaterialIcons name="check-circle-outline" size={18} color={Palette.blue} />
        <AppText variant="labelMd" color={Palette.blueDark}>
          Hôm nay: {doneToday} bài đã chữa
        </AppText>
      </View>
    </View>
  );

  const pickers = (
    <View style={styles.pickers}>
      <View style={styles.pickerRow}>
        <AppText variant="labelMd" color={Palette.inkSoft} style={styles.pickerLabel}>
          Môn học
        </AppText>
        <ChoiceChips options={subjectOptions} value={subject} onChange={setSubject} />
      </View>
      <View style={styles.pickerRow}>
        <AppText variant="labelMd" color={Palette.inkSoft} style={styles.pickerLabel}>
          Lớp
        </AppText>
        <ChoiceChips options={gradeOptions} value={grade} onChange={setGrade} />
      </View>
    </View>
  );

  const stage = (
    <DropZone onAssets={addPhotos} style={styles.stage} overStyle={styles.stageOver}>
      {count > 0 ? (
        <>
          <View style={styles.previewWrap}>
            <Image source={{ uri: photos[shown].uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.previewChip}>
              <MaterialIcons name="check-circle-outline" size={16} color={Palette.blue} />
              <AppText variant="labelSm">
                Trang {shown + 1}/{count} · đã có ảnh rõ nét 📸
              </AppText>
            </View>
          </View>
          <View style={styles.thumbs}>
            {photos.map((page, index) => (
              <View key={`${page.uri}-${index}`} style={[styles.thumb, index === shown && styles.thumbActive]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem trang ${index + 1}`}
                  onPress={() => setActive(index)}
                  style={StyleSheet.absoluteFill}>
                  <Image source={{ uri: page.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bỏ trang ${index + 1}`}
                  onPress={() => removePhoto(index)}
                  hitSlop={8}
                  style={styles.thumbRemove}>
                  <MaterialIcons name="close" size={16} color={Palette.white} />
                </Pressable>
              </View>
            ))}
            {!full && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn thêm trang"
                onPress={() => pickPhoto('library')}
                style={[styles.thumb, styles.thumbAdd]}>
                <MaterialIcons name="add-photo-alternate" size={26} color={Palette.blue} />
                <AppText variant="labelSm" color={Palette.blue}>
                  Thêm
                </AppText>
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chọn ảnh bài tập từ máy tính"
          onPress={() => pickPhoto('library')}
          style={({ pressed }) => [styles.empty, narrow && styles.emptyNarrow, pressed && styles.pressed]}>
          <View style={styles.emptyTips}>
            <View style={styles.tipChip}>
              <MaterialIcons name="light-mode" size={16} color={Palette.amberInk} />
              <AppText variant="labelSm">Đủ ánh sáng</AppText>
            </View>
            <View style={styles.tipChip}>
              <MaterialIcons name="crop-free" size={16} color={Palette.amberInk} />
              <AppText variant="labelSm">Thẳng góc</AppText>
            </View>
          </View>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="add-a-photo" size={38} color={Palette.amberInk} />
          </View>
          <AppText variant="headlineSm" style={styles.centerText}>
            Kéo ảnh bài tập vào đây
          </AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.centerText}>
            Hoặc bấm để chọn ảnh vở viết tay, sách bài tập, phiếu bài (tối đa {MAX_PAGES} trang)
          </AppText>
          <View style={styles.supportTag}>
            <MaterialIcons name="verified" size={16} color={Palette.blue} />
            <AppText variant="labelSm" color={Palette.blueDark}>
              Hỗ trợ ảnh JPG, PNG, HEIC
            </AppText>
          </View>
        </Pressable>
      )}

      {count > 0 && (
        <View style={styles.actionChips}>
          <Pressable
            accessibilityRole="button"
            disabled={full}
            onPress={() => pickPhoto('library')}
            style={({ pressed }) => [styles.actionChip, full && styles.disabled, pressed && styles.pressed]}>
            <MaterialIcons name="photo-library" size={20} color={Palette.blue} />
            <AppText variant="labelMd" color={Palette.blue}>
              Chọn thêm ảnh
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => removePhoto(shown)}
            style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}>
            <MaterialIcons name="delete-outline" size={20} color={Palette.coralDark} />
            <AppText variant="labelMd" color={Palette.coralDark}>
              Bỏ trang này
            </AppText>
          </Pressable>
        </View>
      )}

      <BigButton
        label={`${count > 1 ? `${T.Title} chấm ${count} trang nhé!` : `${T.Title} chấm bài ngay!`}  ⭐ +${STARS_PER_GRADING}`}
        icon="auto-fix-high"
        disabled={count === 0}
        onPress={handleGrade}
        loading={grading}
      />
    </DropZone>
  );

  const teacherCard = (
    <Card>
      <View style={styles.teacherRow}>
        <Mascot size={64} />
        <View style={styles.flex}>
          <AppText variant="headlineSm" color={Palette.blue}>
            {T.name}
          </AppText>
          <View style={styles.readyTag}>
            <AppText variant="labelSm" color={Palette.amberInk}>
              Sẵn sàng chấm
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.bubble}>
        <AppText variant="bodyLg">
          “Con chụp ngay ngắn và đủ sáng để {T.word} chấm bài thật nhanh nhé!” 🌸
        </AppText>
      </View>
    </Card>
  );

  const tipsCard = (
    <Card>
      <View style={styles.tipsHeader}>
        <AppText variant="headlineSm" style={styles.flex}>
          Mẹo chụp ảnh đẹp
        </AppText>
        <View style={styles.readyTag}>
          <AppText variant="labelSm" color={Palette.blueDark}>
            Dễ đạt 10/10
          </AppText>
        </View>
      </View>
      <TipRow icon="menu-book" tint={Palette.mintSoft} title="1. Trải phẳng vở" body="Vuốt thẳng các nếp gấp, tránh để giấy bị quắn mép." />
      <TipRow icon="lightbulb-outline" tint={Palette.amberSoft} title="2. Bật đủ đèn bàn" body="Tránh để bóng tay hay điện thoại che mất chữ viết." />
      <TipRow icon="stay-current-portrait" tint={Palette.coralSoft} title="3. Giữ ảnh song song" body="Chụp thẳng phía trên trang giấy để ảnh không bị méo." />
    </Card>
  );

  const recentCard = history.length > 0 && (
    <Card>
      <AppText variant="headlineSm">Bài vừa chấm gần đây</AppText>
      {history.slice(0, 3).map((entry) => (
        <Pressable
          key={entry.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/bai-cham/[id]', params: { id: entry.id } })}
          style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <AppText variant="labelLg">
              {SubjectNames[entry.subject]} · Lớp {entry.grade}
            </AppText>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              {formatDate(entry.createdAt)}
            </AppText>
          </View>
          <View style={styles.recentScore}>
            <AppText variant="labelLg" color={Palette.blueDark}>
              {entry.score}/10
            </AppText>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Palette.inkSoft} />
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Screen>
      {header}
      <Columns
        ratio={1.9}
        main={
          <>
            {pickers}
            {stage}
          </>
        }
        aside={
          <>
            {teacherCard}
            {tipsCard}
            {recentCard}
          </>
        }
        stickyAside={wide}
      />
      {grading && <GradingOverlay photoUri={photos[0]?.uri} pageCount={count} />}
    </Screen>
  );
}

function TipRow({ icon, tint, title, body }: { icon: IconName; tint: string; title: string; body: string }) {
  return (
    <View style={[styles.tipRow, { backgroundColor: tint }]}>
      <View style={styles.tipIcon}>
        <MaterialIcons name={icon} size={22} color={Palette.blueDark} />
      </View>
      <View style={styles.flex}>
        <AppText variant="labelLg">{title}</AppText>
        <AppText variant="bodySm" color={Palette.inkSoft}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

const CORNER = 28;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
  },
  headerNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pickers: {
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pickerLabel: {
    width: 60,
  },
  stage: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg + 8,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  stageOver: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mintSoft,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two + 2,
    minHeight: 340,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.mint,
    backgroundColor: Palette.surfaceMuted,
    padding: Spacing.four,
  },
  emptyNarrow: {
    minHeight: 260,
  },
  emptyTips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  previewWrap: {
    height: 420,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceMuted,
    overflow: 'hidden',
  },
  previewChip: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.mint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: Palette.blue,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
  thumb: {
    width: 84,
    height: 112,
    borderRadius: Radius.md - 4,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: Palette.blue,
  },
  thumbAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.blue,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17,28,45,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three + 4,
    minHeight: 46,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  readyTag: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 1,
  },
  bubble: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
  },
  recentScore: {
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
});
