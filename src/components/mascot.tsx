import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

const fullBody = require('@/assets/images/co-giao.png');
const face = require('@/assets/images/co-giao-mat.png');

type Props = {
  size?: number;
  background?: string;
  /** "face": chỉ khuôn mặt (ảnh đại diện nhỏ); "full": cả người. */
  variant?: 'face' | 'full';
};

// "Cô Giáo Nhí": cô giáo đeo kính, buộc tóc, cầm ngôi sao và bút chì (ảnh từ Stitch).
export function Mascot({ size = 64, background = Palette.mintSoft, variant = 'face' }: Props) {
  if (variant === 'full') {
    return (
      <Image
        source={fullBody}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Cô Giáo Nhí"
      />
    );
  }
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}>
      <Image source={face} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Cô Giáo Nhí" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.white,
  },
});
