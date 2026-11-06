import { useWindowDimensions } from 'react-native';

import { DESKTOP_MIN_WIDTH } from '@/web/constants';

/** Cửa sổ đủ rộng để dùng bố cục máy tính (thanh bên + 2 cột). */
export function useIsDesktop() {
  return useWindowDimensions().width >= DESKTOP_MIN_WIDTH;
}
