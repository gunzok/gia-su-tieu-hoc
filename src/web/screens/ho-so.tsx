import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { avatarEmoji, avatarOptions } from '@/lib/profile';
import { APP_NAME, teachers, type TeacherId } from '@/lib/teacher';
import { GRADE_OPTIONS, useProfileForm } from '@/lib/use-profile-form';
import { Columns } from '@/web/columns';
import { OnboardingFrame } from '@/web/onboarding-frame';
import { useLayout } from '@/web/use-layout';

const gradeIcons: Record<number, IconName> = {
  1: 'spellcheck',
  2: 'calculate',
  3: 'menu-book',
  4: 'explore',
  5: 'military-tech',
};

// Màn "Hồ sơ của bé" bản web (tạo lần đầu và sửa), theo Stitch "Web App v2 - Hồ sơ của bé":
// cột trái lời chào + thẻ học sinh xem trước (dính khi cuộn), cột phải 4 bước chọn.
export default function WebProfileScreen() {
  const form = useProfileForm();
  const { wide } = useLayout();
  const teacherName = teachers[form.chosenTeacher].name;

  const aside = (
    <>
      <Card style={styles.greeting} borderColor={Palette.mint}>
        <View style={styles.bubble}>
          <AppText variant="labelLg">{APP_NAME} chào con nhé! 👋</AppText>
          <AppText variant="bodyMd">Con tên là gì và năm nay con lên lớp mấy rồi nhỉ?</AppText>
        </View>
        {wide && (
          <View style={styles.mascot}>
            <Mascot variant="full" size={200} teacher={form.chosenTeacher} />
          </View>
        )}
      </Card>
      <Card>
        <View style={styles.cardHead}>
          <MaterialIcons name="badge" size={22} color={Palette.blue} />
          <AppText variant="labelLg" style={styles.flex}>
            Thẻ học sinh
          </AppText>
          <View style={styles.previewTag}>
            <AppText variant="labelSm" color={Palette.blue}>
              Xem trước
            </AppText>
          </View>
        </View>
        <View style={styles.studentCard}>
          <View style={styles.studentAvatar}>
            <AppText style={styles.studentEmoji}>{avatarEmoji(form.avatar)}</AppText>
          </View>
          <View style={styles.flexShrink}>
            <AppText variant="headlineSm" numberOfLines={1}>
              {form.name.trim() || 'Tên của con'}
            </AppText>
            <View style={styles.studentTags}>
              <View style={[styles.smallTag, { backgroundColor: Palette.blue }]}>
                <AppText variant="labelSm" color={Palette.white}>
                  Lớp {form.grade}
                </AppText>
              </View>
              <View style={[styles.smallTag, { backgroundColor: Palette.amberSoft }]}>
                <AppText variant="labelSm" color={Palette.amberInk}>
                  {teacherName}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </>
  );

  const main = (
    <>
      <Card>
        <StepTitle step={1} icon="face" title="Hình đại diện của con" />
        <View style={styles.avatars}>
          {avatarOptions.map((option) => {
            const selected = option.id === form.avatar;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => form.setAvatar(option.id)}
                style={({ pressed }) => [styles.avatarItem, selected && styles.avatarItemSelected, pressed && styles.pressed]}>
                <View style={styles.avatarCircle}>
                  <AppText style={styles.avatarEmoji}>{option.emoji}</AppText>
                  {selected && (
                    <View style={styles.check}>
                      <MaterialIcons name="check" size={14} color={Palette.white} />
                    </View>
                  )}
                </View>
                <AppText variant="labelMd" color={selected ? Palette.blue : Palette.inkSoft}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <StepTitle
          step={2}
          icon="edit"
          title="Tên thân mật của con"
          hint="Tên bé dùng để gia sư xưng hô và khen ngợi mỗi ngày"
        />
        <View style={styles.inputRow}>
          <MaterialIcons name="sentiment-satisfied-alt" size={24} color={Palette.blue} />
          <TextInput
            value={form.name}
            onChangeText={form.setName}
            placeholder="Ví dụ: Bông, Bin, Khang"
            placeholderTextColor={Palette.inkSoft}
            maxLength={20}
            autoCapitalize="words"
            accessibilityLabel="Tên thân mật của con"
            style={styles.input}
          />
          {form.name.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá tên"
              onPress={() => form.setName('')}
              style={styles.clear}>
              <MaterialIcons name="close" size={22} color={Palette.inkSoft} />
            </Pressable>
          )}
        </View>
      </Card>

      <Card>
        <StepTitle
          step={3}
          icon="record-voice-over"
          title="Con muốn học cùng ai?"
          hint="Hình ảnh, cách xưng hô và giọng đọc lời nhận xét"
        />
        <View style={styles.teacherRow}>
          {(Object.keys(teachers) as TeacherId[]).map((id) => {
            const option = teachers[id];
            const locked = id === 'thay' && !form.isPremium;
            const selected = form.chosenTeacher === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: locked }}
                accessibilityLabel={locked ? `${option.name}, chỉ dành cho gói Plus` : option.name}
                onPress={() => form.pickTeacher(id)}
                style={({ pressed }) => [
                  styles.teacherTile,
                  selected && styles.teacherTileSelected,
                  locked && styles.teacherTileLocked,
                  pressed && styles.pressed,
                ]}>
                <View style={locked ? styles.dim : undefined}>
                  <Mascot teacher={id} size={64} background={Palette.white} />
                </View>
                <View style={styles.flexShrink}>
                  <AppText variant="headlineSm">{option.name}</AppText>
                  {locked ? (
                    <View style={styles.plusTag}>
                      <MaterialIcons name="lock-outline" size={14} color={Palette.amberInk} />
                      <AppText variant="labelSm" color={Palette.amberInk}>
                        Gói Plus
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="bodySm" color={selected ? Palette.blueDark : Palette.inkSoft}>
                      {selected ? 'Đang chọn' : 'Chạm để nghe thử'}
                    </AppText>
                  )}
                </View>
                {selected && (
                  <View style={[styles.check, styles.checkInline]}>
                    <MaterialIcons name="check" size={14} color={Palette.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <StepTitle step={4} icon="school" title="Con đang học lớp mấy?" />
        <View style={styles.grades}>
          {GRADE_OPTIONS.map((option) => {
            const selected = option.grade === form.grade;
            return (
              <Pressable
                key={option.grade}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Lớp ${option.grade}, ${option.hint}`}
                onPress={() => form.setGrade(option.grade)}
                style={({ pressed }) => [styles.gradeTile, selected && styles.gradeTileSelected, pressed && styles.pressed]}>
                <MaterialIcons name={gradeIcons[option.grade]} size={22} color={Palette.blue} />
                <AppText variant="headlineSm">Lớp {option.grade}</AppText>
                <AppText variant="bodySm" color={selected ? Palette.blueDark : Palette.inkSoft}>
                  {option.hint}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={wide ? styles.ctaWide : undefined}>
        <BigButton
          label={form.editing ? 'Lưu hồ sơ' : 'Hoàn tất & Vào học thôi!'}
          variant="mint"
          icon="rocket-launch"
          iconAfter
          onPress={form.finish}
        />
      </View>
    </>
  );

  return (
    <OnboardingFrame title={form.editing ? 'Sửa hồ sơ của bé' : 'Hồ sơ của bé'} back onSkip={form.skip}>
      {/* Máy tính: cột xem trước 4 phần (trái, dính khi cuộn), các bước chọn 8 phần. Hẹp hơn: xếp dọc. */}
      {wide ? (
        <View style={styles.row}>
          <View style={[styles.column, styles.asideColumn]}>{aside}</View>
          <View style={[styles.column, styles.mainColumn]}>{main}</View>
        </View>
      ) : (
        <Columns main={aside} aside={main} />
      )}
    </OnboardingFrame>
  );
}

function StepTitle({ step, icon, title, hint }: { step: number; icon: IconName; title: string; hint?: string }) {
  return (
    <View style={styles.stepTitle}>
      <View style={styles.stepNumber}>
        <AppText variant="labelMd" color={Palette.blue}>
          {step}
        </AppText>
      </View>
      <View style={styles.flexShrink}>
        <View style={styles.stepRow}>
          <MaterialIcons name={icon} size={20} color={Palette.blue} />
          <AppText variant="headlineSm" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        {hint && (
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {hint}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    minWidth: 0,
    gap: Spacing.four,
  },
  asideColumn: {
    flexGrow: 4,
    flexBasis: 0,
    // Chỉ có trên trình duyệt: cột xem trước dính lại khi cuộn.
    position: 'sticky',
    top: Spacing.four,
  } as object,
  mainColumn: {
    flexGrow: 8,
    flexBasis: 0,
  },
  greeting: {
    gap: Spacing.three,
  },
  bubble: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Palette.mintSoft,
  },
  mascot: {
    alignItems: 'center',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  previewTag: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    backgroundColor: Palette.mintSoft,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.mint,
    backgroundColor: Palette.mintSoft,
  },
  studentAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Palette.white,
    backgroundColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentEmoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  studentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
    marginTop: Spacing.one,
  },
  smallTag: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  stepTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  avatarItem: {
    flexGrow: 1,
    flexBasis: 96,
    minHeight: 44,
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarItemSelected: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mintSoft,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 34,
    lineHeight: 42,
  },
  check: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInline: {
    position: 'relative',
    top: 0,
    right: 0,
    marginLeft: 'auto',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    paddingLeft: Spacing.three + 4,
    paddingRight: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
  },
  input: {
    flex: 1,
    minHeight: 52,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Palette.ink,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  teacherTile: {
    flexGrow: 1,
    flexBasis: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  teacherTileSelected: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mintSoft,
  },
  teacherTileLocked: {
    borderStyle: 'dashed',
  },
  dim: {
    opacity: 0.6,
  },
  plusTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    backgroundColor: Palette.amberSoft,
  },
  grades: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gradeTile: {
    flexGrow: 1,
    flexBasis: 120,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
  },
  gradeTileSelected: {
    borderColor: Palette.blue,
    backgroundColor: Palette.mint,
  },
  ctaWide: {
    alignSelf: 'flex-end',
    minWidth: 360,
  },
});
