import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTeacher } from '@/lib/profile';

// Các bước hiện lần lượt để bé biết cô vẫn đang làm việc.
const stepTexts = [
  { icon: '👀', text: 'đang đọc bài của con…' },
  { icon: '✏️', text: 'đang kiểm tra từng câu…' },
  { icon: '🧮', text: 'đang tính lại đáp số…' },
  { icon: '💬', text: 'đang viết lời nhận xét…' },
];
const stepSeconds = 6;
const frameSize = 168;

type Props = {
  photoUri?: string;
  /** Số trang đang chấm (hiện "3 trang" khi nhiều hơn 1). */
  pageCount?: number;
};

// Màn chờ khi đang chấm bài: cú nhún nhảy, ảnh bài có vạch quét, các bước và số giây đã chờ.
// Chỉ gắn vào khi đang chấm, nên mỗi lần chấm đều đếm lại từ 0.
export function GradingOverlay({ photoUri, pageCount = 1 }: Props) {
  const [seconds, setSeconds] = useState(0);
  const T = useTeacher();
  const steps = stepTexts.map((step) => ({ ...step, text: `${T.Title} ${step.text}` }));

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const bounce = useSharedValue(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 420, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
    scan.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [bounce, scan]);

  const mascotStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));
  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scan.value * (frameSize - 6) }] }));

  const stepIndex = Math.min(Math.floor(seconds / stepSeconds), steps.length - 1);

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`${T.Title} đang chấm bài, con đợi một chút nhé`}>
          <Animated.View style={mascotStyle}>
            <Mascot size={88} />
          </Animated.View>

          <AppText variant="headlineLg" style={styles.center}>
            {pageCount > 1 ? `${T.Title} đang chấm ${pageCount} trang` : `${T.Title} đang chấm bài`}
          </AppText>

          {photoUri && (
            <View style={styles.frame}>
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Animated.View style={[styles.scanLine, scanStyle]} />
            </View>
          )}

          <View style={styles.steps}>
            {steps.map((step, index) => {
              const done = index < stepIndex;
              const active = index === stepIndex;
              return (
                <View key={step.text} style={[styles.stepRow, !done && !active && styles.stepPending]}>
                  <AppText style={styles.stepIcon}>{done ? '✅' : step.icon}</AppText>
                  <AppText
                    variant={active ? 'labelLg' : 'bodyMd'}
                    color={active ? Palette.blueDark : Palette.inkSoft}
                    style={styles.flex}>
                    {step.text}
                  </AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.timer}>
            <AppText variant="labelMd" color={Palette.amberInk}>
              ⏱️ Đã chờ {seconds} giây
            </AppText>
          </View>
          <AppText variant="bodySm" color={Palette.inkSoft} style={styles.center}>
            {seconds < 40
              ? `Con đợi ${T.word} một chút nhé, đừng tắt máy!`
              : `Bài hơi dài, ${T.word} cần thêm chút thời gian. Sắp xong rồi!`}
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: Palette.border,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  frame: {
    width: frameSize,
    height: frameSize,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Palette.mint,
    backgroundColor: Palette.surfaceMuted,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#4EDEA3',
    opacity: 0.9,
  },
  steps: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepPending: {
    opacity: 0.45,
  },
  stepIcon: {
    fontSize: 20,
    lineHeight: 26,
    width: 28,
    textAlign: 'center',
  },
  timer: {
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
