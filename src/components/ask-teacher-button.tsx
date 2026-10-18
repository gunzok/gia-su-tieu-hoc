import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTeacher } from '@/lib/profile';

// Nút "Hỏi cô" ở mỗi câu: mở màn trò chuyện để bé hỏi thêm về câu đó.
export function AskTeacherButton({ onPress }: { onPress: () => void }) {
  const T = useTeacher();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hỏi ${T.word} về câu này`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <MaterialIcons name="chat-bubble-outline" size={18} color={Palette.blueDark} />
      <AppText variant="labelMd" color={Palette.blueDark}>
        Hỏi {T.word}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 40,
    backgroundColor: Palette.white,
    borderWidth: 2,
    borderColor: Palette.mint,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
