import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
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
import { Columns } from '@/web/columns';
import { DropZone } from '@/web/drop-zone';
import { Screen } from '@/web/screen';

const gradeOptions = [1, 2, 3, 4, 5].map((g) => ({
  value: g,
  label: `Lớp ${g}`,
}));
const subjectOptions = allSubjects.map((s) => ({
  value: s,
  label: `${SubjectIcons[s]} ${SubjectNames[s]}`,
}));

export default function ScanScreen() {
  const { grade, setGrade, subject, setSubject, photos, removePhoto, grading, pickPhoto, addPhotos, submitForGrading } =
    useHomeworkSession();
  const count = photos.length;
  const full = count >= MAX_PAGES;
  const T = useTeacher();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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
  return (
    <Screen>
      <View style={styles.deskHeader}>
        <View style={styles.deskHeaderIcon}>
          <MaterialIcons name="document-scanner" size={30} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineMd">Phòng chấm bài thông minh</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Tải ảnh bài tập về nhà lên, {T.Title} sẽ kiểm tra và giải thích từng bước cho con.
          </AppText>
        </View>
        <View style={styles.todayPill}>
          <MaterialIcons name="check-circle-outline" size={18} color={Palette.blue} />
          <AppText variant="labelMd" color={Palette.blueDark}>
            Hôm nay: {doneToday} bài đã chữa
          </AppText>
        </View>
      </View>

      <Columns
        ratio={1.9}
        main={
          <>
            <View style={styles.deskPickers}>
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

            <DropZone onAssets={addPhotos} style={styles.deskStage} overStyle={styles.deskStageOver}>
              {count > 0 ? (
                <>
                  <View style={styles.statusPill}>
                    <MaterialIcons name="check-circle-outline" size={18} color={Palette.blue} />
                    <AppText variant="labelMd">Đã có {count}/{MAX_PAGES} trang vở 📸</AppText>
                  </View>
                  <View style={styles.deskPages}>
                    {photos.map((page, index) => (
                      <View key={`${page.uri}-${index}`} style={[styles.page, styles.deskPage]}>
                        <Image source={{ uri: page.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        <View style={styles.pageNumber}>
                          <AppText variant="labelSm" color={Palette.white}>
                            Trang {index + 1}
                          </AppText>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Bỏ trang ${index + 1}`}
                          onPress={() => removePhoto(index)}
                          hitSlop={8}
                          style={styles.pageRemove}>
                          <MaterialIcons name="close" size={18} color={Palette.white} />
                        </Pressable>
                      </View>
                    ))}
                    {!full && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Chọn thêm trang"
                        onPress={() => pickPhoto('library')}
                        style={[styles.page, styles.deskPage, styles.addPage]}>
                        <MaterialIcons name="add-photo-alternate" size={32} color={Palette.blue} />
                        <AppText variant="labelMd" color={Palette.blue}>
                          Thêm trang
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
                  style={({ pressed }) => [styles.deskEmpty, pressed && styles.pressed]}>
                  <View style={styles.deskEmptyIcon}>
                    <MaterialIcons name="add-a-photo" size={36} color={Palette.amberInk} />
                  </View>
                  <AppText variant="headlineSm">Kéo ảnh bài tập vào đây</AppText>
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

              <View style={styles.deskActions}>
                {count > 0 && (
                  <BigButton
                    label="Chọn ảnh khác"
                    icon="photo-library"
                    variant="ghost"
                    disabled={full}
                    onPress={() => pickPhoto('library')}
                  />
                )}
                <View style={styles.deskGrade}>
                  <BigButton
                    label={count > 1 ? `${T.Title} chấm ${count} trang nhé!` : `${T.Title} chấm bài nhé!`}
                    icon="auto-fix-high"
                    disabled={count === 0}
                    onPress={handleGrade}
                    loading={grading}
                  />
                </View>
              </View>
            </DropZone>
          </>
        }
        aside={
          <>
            <Card>
              <View style={styles.teacherRow}>
                <Mascot size={64} />
                <View style={styles.flex}>
                  <AppText variant="headlineSm" color={Palette.blue}>
                    {T.name}
                  </AppText>
                  <AppText variant="bodySm" color={Palette.inkSoft}>
                    Đang lắng nghe con
                  </AppText>
                </View>
              </View>
              <View style={styles.bubble}>
                <AppText variant="bodyMd">
                  “Con chụp ngay ngắn và đủ sáng để {T.word} chấm bài thật nhanh nhé!” 🌸
                </AppText>
              </View>
            </Card>

            <Card>
              <View style={styles.tipsHeader}>
                <MaterialIcons name="tips-and-updates" size={22} color={Palette.amberInk} />
                <AppText variant="headlineSm">3 mẹo chụp đạt điểm 10</AppText>
              </View>
              <TipRow number={1} tint={Palette.mintSoft} title="Trải phẳng trang vở" body="Để trang vở nằm thẳng trên mặt bàn, tránh để giấy bị quắn mép hay gập nếp." />
              <TipRow number={2} tint={Palette.amberSoft} title="Bật đủ đèn bàn học" body="Không để bóng tay hay điện thoại che mất các số, chữ viết của con." />
              <TipRow number={3} tint={Palette.coralSoft} title="Giữ ảnh song song" body="Chụp thẳng phía trên trang giấy để ảnh không bị méo góc." />
            </Card>

            {history.length > 0 && (
              <Card>
                <AppText variant="headlineSm">Bài nộp gần đây</AppText>
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
                        {new Date(entry.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </AppText>
                    </View>
                    <View style={styles.recentScore}>
                      <AppText variant="labelLg" color={Palette.blueDark}>
                        {entry.score}/10
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </>
        }
      />

      {grading && <GradingOverlay photoUri={photos[0]?.uri} pageCount={count} />}
    </Screen>
  );
}

function TipRow({ number, tint, title, body }: { number: number; tint: string; title: string; body: string }) {
  return (
    <View style={[styles.tipRow, { backgroundColor: tint }]}>
      <View style={styles.tipNumber}>
        <AppText variant="labelLg" color={Palette.blueDark}>
          {number}
        </AppText>
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
  },
  deskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
  },
  deskHeaderIcon: {
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
    gap: Spacing.one + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  deskPickers: {
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
    width: 64,
  },
  deskStage: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg + 8,
    padding: Spacing.four,
    gap: Spacing.four,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  deskStageOver: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mintSoft,
  },
  deskEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two + 2,
    minHeight: 300,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.mint,
    backgroundColor: Palette.surfaceMuted,
    padding: Spacing.four,
  },
  deskEmptyIcon: {
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
  deskPages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  deskPage: {
    width: 170,
  },
  deskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  deskGrade: {
    flex: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tipRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: Radius.md + 4,
    padding: Spacing.three,
  },
  tipNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
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
  page: {
    width: 150,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.white,
  },
  pageNumber: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: 'rgba(17,28,45,0.65)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  pageRemove: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(17,28,45,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.blue,
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
});
