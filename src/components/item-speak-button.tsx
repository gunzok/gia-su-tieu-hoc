import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet } from 'react-native';

import { Palette } from '@/constants/theme';
import { useTeacher } from '@/lib/profile';

type Props = {
  number: number;
  /** Câu này đang được đọc. */
  speakingNow: boolean;
  onSpeak: () => void;
};

// Nút loa ở mỗi câu: bấm để gia sư giảng lại câu đó, bấm lần nữa để dừng.
export function ItemSpeakButton({ number, speakingNow, onSpeak }: Props) {
  const T = useTeacher();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={speakingNow ? 'Dừng đọc' : `Nghe ${T.word} giảng câu ${number}`}
      onPress={onSpeak}
      hitSlop={6}
      style={({ pressed }) => [styles.button, speakingNow && styles.active, pressed && styles.pressed]}>
      <MaterialIcons
        name={speakingNow ? 'stop' : 'volume-up'}
        size={24}
        color={speakingNow ? Palette.white : Palette.blueDark}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.white,
    borderWidth: 2,
    borderColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: Palette.blue,
    borderColor: Palette.blue,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
