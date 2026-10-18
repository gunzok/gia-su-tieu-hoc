import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useTeacher } from '@/lib/profile';
import { teacherOf, type TeacherId } from '@/lib/teacher';

type Props = {
  size?: number;
  background?: string;
  /** "face": chỉ khuôn mặt (ảnh đại diện nhỏ); "full": cả người. */
  variant?: 'face' | 'full';
  /** Mặc định là gia sư bé đang học cùng; truyền vào để vẽ một gia sư cụ thể (màn chọn gia sư). */
  teacher?: TeacherId;
};

// Gia sư của bé: Cô giáo đeo kính buộc tóc, hoặc Thầy giáo đeo kính (ảnh từ Stitch).
export function Mascot({ size = 64, background = Palette.mintSoft, variant = 'face', teacher }: Props) {
  const current = useTeacher();
  const shown = teacher ? teacherOf(teacher) : current;
  if (variant === 'full') {
    return (
      <Image
        source={shown.fullBody}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel={shown.name}
      />
    );
  }
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}>
      <Image source={shown.face} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={shown.name} />
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
