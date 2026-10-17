import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette } from '@/constants/theme';

type Props = {
  size?: number;
  background?: string;
};

// Linh vật cú mèo đội mũ tốt nghiệp của thiết kế.
export function Mascot({ size = 64, background = Palette.amberSoft }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}>
      <AppText style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }}>🦉</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
  },
});
