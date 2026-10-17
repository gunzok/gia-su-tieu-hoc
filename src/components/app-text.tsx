import { Text, type TextProps } from 'react-native';

import { Palette, Type, type TypeVariant } from '@/constants/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
};

// Chữ dùng font và thang chữ của thiết kế Stitch.
export function AppText({ variant = 'bodyMd', color = Palette.ink, style, ...rest }: Props) {
  return <Text style={[Type[variant], { color }, style]} {...rest} />;
}
