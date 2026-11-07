import { useWindowDimensions } from 'react-native';

import { MEDIUM_MIN_WIDTH, RailWidth, SidebarWidth, WIDE_MIN_WIDTH } from '@/web/constants';

export type LayoutMode = 'wide' | 'medium' | 'narrow';

/**
 * Ba cỡ màn hình:
 * - wide (>= 1100px): máy tính, thanh bên có chữ, nhiều cột.
 * - medium (700–1099px): máy gập mở ra / tablet, thanh bên chỉ biểu tượng, hai khung.
 * - narrow (< 700px): điện thoại, thanh tab dưới, một cột.
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const mode: LayoutMode = width >= WIDE_MIN_WIDTH ? 'wide' : width >= MEDIUM_MIN_WIDTH ? 'medium' : 'narrow';
  return {
    mode,
    wide: mode === 'wide',
    medium: mode === 'medium',
    narrow: mode === 'narrow',
    /** Chiều rộng thanh điều hướng bên trái (0 khi dùng tab dưới). */
    navWidth: mode === 'wide' ? SidebarWidth : mode === 'medium' ? RailWidth : 0,
    width,
  };
}
