import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useHomeworkSession } from '@/lib/homework-session';

const visibleMs = 6000;

// Thông báo nhỏ trượt xuống ở đầu màn hình, tự ẩn sau vài giây, chạm vào thì ẩn ngay.
// Không chặn màn hình nên bé vẫn xem và nghe kết quả bình thường.
export function NoticeToast() {
  const { notice, dismissNotice } = useHomeworkSession();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, visibleMs);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  return (
    <View pointerEvents="box-none" style={[styles.layer, { top: insets.top + Spacing.two }]}>
      <Animated.View key={notice.id} entering={FadeInUp} exiting={FadeOutUp} style={styles.wrap}>
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={`${notice.title}. ${notice.message}`}
          onPress={dismissNotice}
          style={styles.toast}>
          <View style={styles.icon}>
            <MaterialIcons name="computer" size={20} color={Palette.amberInk} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelMd" color={Palette.amberInk}>
              {notice.title}
            </AppText>
            <AppText variant="bodySm" color={Palette.ink}>
              {notice.message}
            </AppText>
          </View>
          <MaterialIcons name="close" size={18} color={Palette.inkSoft} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  layer: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  // Giữ bề ngang cố định theo màn hình để chữ xuống dòng, không tràn ra ngoài.
  wrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    backgroundColor: Palette.amberSoft,
    borderColor: Palette.amber,
    borderWidth: 1,
    borderRadius: Radius.md + 4,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
