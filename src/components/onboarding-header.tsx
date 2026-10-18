import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Spacing } from '@/constants/theme';
import { APP_NAME } from '@/lib/teacher';

type Props = {
  title: string;
  /** Bấm "Bỏ qua"; không truyền thì không hiện nút. */
  onSkip?: () => void;
};

// Thanh đầu trang của các màn mở app lần đầu: nút quay lại, tiêu đề, nút "Bỏ qua".
export function OnboardingHeader({ title, onSkip }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        disabled={!router.canGoBack()}
        onPress={() => router.back()}
        style={[styles.back, !router.canGoBack() && styles.hidden]}>
        <MaterialIcons name="arrow-back" size={24} color={Palette.ink} />
      </Pressable>
      <View style={styles.titles}>
        <AppText variant="labelSm" color={Palette.blue}>
          {APP_NAME.toUpperCase()}
        </AppText>
        <AppText variant="labelLg">{title}</AppText>
      </View>
      {onSkip ? (
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
          <AppText variant="labelMd">Bỏ qua</AppText>
        </Pressable>
      ) : (
        <View style={styles.skip} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    opacity: 0,
  },
  titles: {
    flex: 1,
    alignItems: 'center',
  },
  skip: {
    width: 64,
    alignItems: 'flex-end',
    paddingVertical: Spacing.two,
  },
});
