import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { PulseRing } from '@/components/sound-wave';
import { Palette } from '@/constants/theme';
import { useTeacher } from '@/lib/profile';

type Props = {
  number: number;
  /** Câu này đang được đọc. */
  speakingNow: boolean;
  onSpeak: () => void;
  /** Lời đọc cho người khiếm thị; mặc định "Nghe cô giảng câu …". */
  label?: string;
};

const SIZE = 48;

// Nút loa ở mỗi câu: bấm để gia sư giảng lại câu đó, bấm lần nữa để dừng.
// Đang đọc thì có vòng sóng toả ra quanh nút.
export function ItemSpeakButton({ number, speakingNow, onSpeak, label }: Props) {
  const T = useTeacher();
  return (
    <View style={styles.wrap}>
      <PulseRing active={speakingNow} size={SIZE} color={Palette.blue} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={speakingNow ? 'Dừng đọc' : (label ?? `Nghe ${T.word} giảng câu ${number}`)}
        onPress={onSpeak}
        hitSlop={6}
        style={({ pressed }) => [styles.button, speakingNow && styles.active, pressed && styles.pressed]}>
        <MaterialIcons
          name={speakingNow ? 'stop' : 'volume-up'}
          size={24}
          color={speakingNow ? Palette.white : Palette.blueDark}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
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
