import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { LEGAL_DRAFT, LEGAL_UPDATED_AT, type LegalSection } from '@/web/legal-content';
import { Screen } from '@/web/screen';

// Trang Chính sách / Điều khoản của bản web: chữ to, dễ đọc, cột hẹp cho dễ đọc trên màn hình lớn.
export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <Screen>
      <View style={styles.page}>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/')} style={styles.back}>
          <MaterialIcons name="arrow-back" size={20} color={Palette.blue} />
          <AppText variant="labelMd" color={Palette.blue}>
            Về trang chủ
          </AppText>
        </Pressable>
        <AppText variant="headlineLg" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="bodyMd" color={Palette.inkSoft}>
          {intro} Cập nhật ngày {LEGAL_UPDATED_AT}.
        </AppText>
        {LEGAL_DRAFT && (
          <View style={styles.draft}>
            <AppText variant="labelMd" color={Palette.amberInk}>
              Bản nháp đang chờ rà soát, chưa phải bản chính thức.
            </AppText>
          </View>
        )}
        {sections.map((section) => (
          <Card key={section.title}>
            <AppText variant="headlineSm" accessibilityRole="header">
              {section.title}
            </AppText>
            <View style={styles.list}>
              {section.body.map((line) => (
                <View key={line} style={styles.item}>
                  <AppText variant="bodyMd" color={Palette.blue}>
                    •
                  </AppText>
                  <AppText variant="bodyMd" style={styles.flex}>
                    {line}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  draft: {
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  flex: { flex: 1 },
  list: { gap: Spacing.two, marginTop: Spacing.two },
  item: { flexDirection: 'row', gap: Spacing.two },
});
