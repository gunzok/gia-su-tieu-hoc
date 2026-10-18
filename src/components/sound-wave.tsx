import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type WaveProps = {
  /** Đang phát âm thanh: các vạch nhảy lên xuống. */
  active: boolean;
  /** Chiều cao lớn nhất của từng vạch. */
  heights: number[];
  colors: ColorValue[];
  barWidth?: number;
  gap?: number;
  /** Chiều cao các vạch khi đứng yên. */
  restHeight?: number;
  style?: StyleProp<ViewStyle>;
};

// Sóng âm: khi cô đang đọc thì các vạch nhảy so le như đang nói, dừng thì nằm yên.
export function SoundWave({ active, heights, colors, barWidth = 5, gap = 6, restHeight = 6, style }: WaveProps) {
  return (
    <View style={[styles.wave, { gap }, style]}>
      {heights.map((height, index) => (
        <WaveBar
          key={index}
          index={index}
          active={active}
          height={height}
          restHeight={Math.min(restHeight, height)}
          width={barWidth}
          color={colors[index % colors.length]}
        />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  active,
  height,
  restHeight,
  width,
  color,
}: {
  index: number;
  active: boolean;
  height: number;
  restHeight: number;
  width: number;
  color: ColorValue;
}) {
  const level = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const duration = 260 + (index % 4) * 70;
      level.value = withDelay(
        (index % 5) * 80,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.25, { duration, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(level);
      level.value = withTiming(0, { duration: 200 });
    }
  }, [active, index, level]);

  const animated = useAnimatedStyle(() => ({
    height: restHeight + (height - restHeight) * level.value,
  }));

  return <Animated.View style={[{ width, borderRadius: width / 2, backgroundColor: color }, animated]} />;
}

type PulseProps = {
  active: boolean;
  /** Đường kính nút bên trong. */
  size: number;
  color: ColorValue;
};

// Vòng tròn toả ra quanh nút loa khi đang đọc. Đặt bên trong nút (position absolute).
export function PulseRing({ active, size, color }: PulseProps) {
  return (
    <>
      <Ring active={active} size={size} color={color} delay={0} />
      <Ring active={active} size={size} color={color} delay={600} />
    </>
  );
}

function Ring({ active, size, color, delay }: PulseProps & { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (active) {
      progress.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), -1, false),
      );
    }
  }, [active, delay, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value === 0 ? 0 : 0.6 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.6 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color }, animated]}
    />
  );
}

const styles = StyleSheet.create({
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
});
