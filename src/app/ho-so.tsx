import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton, type IconName } from '@/components/big-button';
import { Card } from '@/components/card';
import { Mascot } from '@/components/mascot';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Screen } from '@/components/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { useIsPremium } from '@/lib/payments';
import { avatarOptions, useProfile } from '@/lib/profile';
import { speakVietnamese } from '@/lib/speech';
import { APP_NAME, teachers, type TeacherId } from '@/lib/teacher';

const gradeOptions: { grade: number; icon: IconName; hint: string }[] = [
  { grade: 1, icon: 'spellcheck', hint: 'Làm quen chữ & số' },
  { grade: 2, icon: 'calculate', hint: 'Cộng trừ có nhớ' },
  { grade: 3, icon: 'menu-book', hint: 'Bảng nhân, chia' },
  { grade: 4, icon: 'explore', hint: 'Phân số, văn tả' },
  { grade: 5, icon: 'military-tech', hint: 'Số thập phân & tốt nghiệp tiểu học' },
];

// Thiết kế Stitch "Hồ sơ của bé - Tên & Lớp". Dùng cả lúc mở app lần đầu lẫn khi sửa hồ sơ.
export default function ProfileScreen() {
  const { profile, saveProfile } = useProfile();
  const [name, setName] = useState(profile?.name ?? '');
  const [grade, setGrade] = useState(profile?.grade ?? 2);
  const [avatar, setAvatar] = useState<string>(profile?.avatar ?? avatarOptions[0].id);
  const isPremium = useIsPremium();
  const [teacher, setTeacher] = useState<TeacherId>(profile?.teacher ?? 'co');
  // Hết gói Plus thì lưu lại là Cô giáo.
  const chosenTeacher: TeacherId = isPremium ? teacher : 'co';
  const editing = profile !== null;

  function pickTeacher(id: TeacherId) {
    if (id === 'thay' && !isPremium) {
      Alert.alert(
        'Dành cho gói Plus',
        'Chọn học cùng Thầy giáo (hình và giọng đọc của thầy) chỉ có trong gói Gia sư Tiểu học Plus. Gói trả phí sẽ sớm mở bán nhé!',
      );
      return;
    }
    setTeacher(id);
    const T = teachers[id];
    speakVietnamese(`Chào con, ${T.word} là ${T.word} giáo của con đây!`, undefined, id);
  }

  async function finish(next = { name: name.trim(), grade, avatar, teacher: chosenTeacher }) {
    await saveProfile(next);
    // Lần đầu: lưu xong thì các tab mở khoá, vào Trang chủ. Đang sửa: quay lại màn trước.
    if (editing && router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <Screen>
      <OnboardingHeader
        title={editing ? 'Sửa hồ sơ của bé' : 'Hồ sơ của bé'}
        onSkip={editing ? undefined : () => finish({ name: '', grade, avatar, teacher: chosenTeacher })}
      />

      <Card style={styles.greeting}>
        <Mascot variant="full" size={84} />
        <View style={styles.bubble}>
          <AppText variant="labelLg">{APP_NAME} chào con nhé! 👋</AppText>
          <AppText variant="bodyMd">Con tên là gì và năm nay con lên lớp mấy rồi nhỉ?</AppText>
        </View>
      </Card>

      <Card>
        <SectionTitle icon="face" title="Hình đại diện của con" />
        <View style={styles.avatars}>
          {avatarOptions.map((option) => {
            const selected = option.id === avatar;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => setAvatar(option.id)}
                style={styles.avatarItem}>
                <View style={[styles.avatarCircle, selected && styles.avatarSelected]}>
                  <AppText style={styles.avatarEmoji}>{option.emoji}</AppText>
                  {selected && (
                    <View style={styles.avatarCheck}>
                      <MaterialIcons name="check" size={16} color={Palette.white} />
                    </View>
                  )}
                </View>
                <AppText variant="labelSm" color={selected ? Palette.ink : Palette.inkSoft}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle icon="edit" title="Tên thân mật của con" />
        <AppText variant="bodySm" color={Palette.inkSoft}>
          Tên bé dùng để gia sư xưng hô và khen ngợi mỗi ngày
        </AppText>
        <View style={styles.inputRow}>
          <MaterialIcons name="sentiment-satisfied-alt" size={24} color={Palette.blue} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ví dụ: Bông, Bin, Khang"
            placeholderTextColor={Palette.inkSoft}
            maxLength={20}
            autoCapitalize="words"
            returnKeyType="done"
            style={styles.input}
          />
          {name.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Xoá tên" onPress={() => setName('')}>
              <MaterialIcons name="close" size={22} color={Palette.inkSoft} />
            </Pressable>
          )}
        </View>
      </Card>

      <Card>
        <SectionTitle icon="record-voice-over" title="Con muốn học cùng ai?" />
        <AppText variant="bodySm" color={Palette.inkSoft}>
          Hình ảnh, cách xưng hô và giọng đọc lời nhận xét
        </AppText>
        <View style={styles.teacherRow}>
          {(Object.keys(teachers) as TeacherId[]).map((id) => {
            const option = teachers[id];
            const locked = id === 'thay' && !isPremium;
            const selected = chosenTeacher === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: locked }}
                accessibilityLabel={locked ? `${option.name}, chỉ dành cho gói Plus` : option.name}
                onPress={() => pickTeacher(id)}
                style={[styles.teacherTile, selected && styles.teacherTileSelected]}>
                <View style={[styles.teacherImageWrap, locked && styles.locked]}>
                  <Mascot teacher={id} size={84} background={Palette.white} />
                </View>
                <AppText variant="labelLg">{option.name}</AppText>
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
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle icon="school" title="Con đang học lớp mấy?" />
        <View style={styles.grades}>
          {gradeOptions.map((option) => {
            const selected = option.grade === grade;
            return (
              <Pressable
                key={option.grade}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setGrade(option.grade)}
                style={[
                  styles.gradeTile,
                  option.grade === 5 && styles.gradeTileWide,
                  { backgroundColor: selected ? Palette.mint : Palette.surfaceMuted },
                  selected && styles.gradeTileSelected,
                ]}>
                <View style={styles.gradeIcon}>
                  <MaterialIcons name={option.icon} size={22} color={Palette.blue} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="labelLg">Lớp {option.grade}</AppText>
                  <AppText variant="bodySm" color={selected ? Palette.blueDark : Palette.inkSoft} numberOfLines={2}>
                    {option.hint}
                  </AppText>
                </View>
                
              </Pressable>
            );
          })}
        </View>
      </Card>

      <BigButton
        label={editing ? 'Lưu hồ sơ' : 'Hoàn tất & Vào học thôi!'}
        variant="mint"
        icon="rocket-launch"
        iconAfter
        onPress={() => finish()}
      />
    </Screen>
  );
}

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <MaterialIcons name={icon} size={22} color={Palette.blue} />
      <AppText variant="headlineSm" style={styles.flex}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubble: {
    flex: 1,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md + 4,
    borderTopLeftRadius: 4,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
  },
  avatarItem: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.one,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 3,
    borderColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: Palette.mintSoft,
    borderColor: Palette.mint,
  },
  avatarEmoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  avatarCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three + 4,
    minHeight: 60,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Palette.ink,
    paddingVertical: Spacing.two,
  },
  grades: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
  gradeTile: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: Spacing.three,
  },
  gradeTileWide: {
    flexBasis: '100%',
  },
  teacherRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  teacherTile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Palette.surfaceMuted,
    paddingVertical: Spacing.three,
  },
  teacherTileSelected: {
    backgroundColor: Palette.mint,
    borderColor: Palette.blue,
  },
  teacherImageWrap: {
    marginBottom: Spacing.one,
  },
  locked: {
    opacity: 0.45,
  },
  plusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: Palette.amber,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 1,
  },
  gradeTileSelected: {
    borderColor: Palette.blue,
  },
  gradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
