import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/app-text';
import type { IconName } from '@/components/big-button';
import { Mascot } from '@/components/mascot';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { avatarEmoji, useProfile } from '@/lib/profile';
import { currentStreak } from '@/lib/rewards';
import { APP_NAME } from '@/lib/teacher';
import { NarrowContentWidth, RailWidth, SidebarWidth, TopBarHeight } from '@/web/constants';
import { useLayout, type LayoutMode } from '@/web/use-layout';

const items: {
  name: string;
  href: '/' | '/quet-bai' | '/chua-bai' | '/tien-do';
  icon: IconName;
  short: string;
  long: string;
}[] = [
  { name: 'index', href: '/', icon: 'home', short: 'Trang chủ', long: 'Trang chủ' },
  { name: 'quet-bai', href: '/quet-bai', icon: 'document-scanner', short: 'Quét bài', long: 'Tải lên & Chấm bài' },
  { name: 'chua-bai', href: '/chua-bai', icon: 'auto-fix-high', short: 'Chữa bài', long: 'Lời giảng & Chữa bài' },
  { name: 'tien-do', href: '/tien-do', icon: 'insights', short: 'Tiến độ', long: 'Báo cáo Tiến độ' },
];

// Khung điều hướng của bản web (bộ thiết kế Stitch "Đa thiết bị & Màn hình gập"):
// - wide (>= 1100px): thanh bên có chữ + thanh trên.
// - medium (700–1099px, máy gập mở ra / tablet): thanh bên chỉ biểu tượng.
// - narrow: thanh trên gọn + thanh tab dưới.
export default function WebShell() {
  const { mode, navWidth } = useLayout();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%', paddingLeft: navWidth }} />
      <TopBar mode={mode} />
      <TabList asChild>
        <NavList mode={mode}>
          {items.map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <NavButton icon={item.icon} mode={mode}>
                {mode === 'wide' ? item.long : item.short}
              </NavButton>
            </TabTrigger>
          ))}
        </NavList>
      </TabList>
    </Tabs>
  );
}

function NavList({ mode, ...props }: TabListProps & { mode: LayoutMode }) {
  const { profile, rewards } = useProfile();
  const streak = currentStreak(rewards, new Date());

  if (mode === 'narrow') {
    return (
      <View {...props} style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>{props.children}</View>
      </View>
    );
  }

  if (mode === 'medium') {
    return (
      <View {...props} style={styles.rail}>
        <Mascot size={52} />
        <View style={styles.railNav}>{props.children}</View>
      </View>
    );
  }

  return (
    <View {...props} style={styles.sidebar}>
      <View style={styles.sidebarTop}>
        <View style={styles.brand}>
          <Mascot size={44} />
          <View>
            <AppText variant="headlineSm" color={Palette.blue} style={styles.brandName}>
              {APP_NAME}
            </AppText>
            <AppText variant="labelSm" color={Palette.inkSoft}>
              Học vui sáng tạo
            </AppText>
          </View>
        </View>
        <View accessible accessibilityLabel={`${rewards.stars} sao, chuỗi ${streak} ngày`} style={styles.statsCard}>
          <AppText variant="labelLg">⭐ {rewards.stars} sao</AppText>
          <View style={styles.statsDivider} />
          <AppText variant="labelLg">🔥 {streak} ngày</AppText>
        </View>
        <View style={styles.nav}>{props.children}</View>
      </View>
      <View style={styles.safeCard}>
        <View style={styles.safeTitle}>
          <MaterialIcons name="verified-user" size={18} color={Palette.blue} />
          <AppText variant="labelMd" color={Palette.blue}>
            Góc An Toàn
          </AppText>
        </View>
        <AppText variant="bodySm" color={Palette.inkSoft}>
          Không quảng cáo, không mở link lạ. Môi trường học tập an toàn cho {profile?.name || 'bé'}.
        </AppText>
      </View>
    </View>
  );
}

function NavButton({
  children,
  isFocused,
  icon,
  mode,
  ...props
}: TabTriggerSlotProps & { icon: IconName; mode: LayoutMode }) {
  if (mode === 'wide') {
    return (
      <Pressable
        {...(props as PressableProps)}
        style={({ pressed }) => [styles.navItem, isFocused && styles.navItemFocused, pressed && styles.pressed]}>
        <MaterialIcons name={icon} size={24} color={isFocused ? Palette.blueDark : Palette.blue} />
        <AppText variant="labelLg" color={isFocused ? Palette.blueDark : Palette.inkSoft}>
          {children}
        </AppText>
      </Pressable>
    );
  }
  // Thanh icon (máy gập / tablet) và tab dưới (điện thoại) cùng kiểu: biểu tượng + chữ nhỏ.
  return (
    <Pressable
      {...(props as PressableProps)}
      style={({ pressed }) => [mode === 'narrow' ? styles.tabButton : styles.railButton, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, isFocused && styles.iconWrapFocused]}>
        <MaterialIcons name={icon} size={24} color={isFocused ? Palette.blueDark : Palette.inkSoft} />
      </View>
      <AppText variant="labelSm" color={isFocused ? Palette.blueDark : Palette.inkSoft}>
        {children}
      </AppText>
    </Pressable>
  );
}

function Pill({
  icon,
  label,
  tint,
  ink,
  accessibilityLabel,
}: {
  icon: string;
  label: string;
  tint: string;
  ink: string;
  accessibilityLabel: string;
}) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[styles.pill, { backgroundColor: tint }]}>
      <AppText style={styles.pillIcon}>{icon}</AppText>
      <AppText variant="labelMd" color={ink}>
        {label}
      </AppText>
    </View>
  );
}

// Thanh trên: huy hiệu lớp, sao thưởng, chuỗi ngày, cổng phụ huynh và hồ sơ của bé.
function TopBar({ mode }: { mode: LayoutMode }) {
  const { profile, rewards } = useProfile();
  const streak = currentStreak(rewards, new Date());
  const wide = mode === 'wide';
  const narrow = mode === 'narrow';
  const left = wide ? SidebarWidth : narrow ? 0 : RailWidth;
  return (
    <View style={[styles.topBar, { left }, narrow && styles.topBarNarrow]}>
      <View style={styles.topGroup}>
        {!narrow && (
          <View style={styles.classPill}>
            <MaterialIcons name="school" size={18} color={Palette.amberInk} />
            <AppText variant="labelMd" color={Palette.amberInk}>
              Lớp {profile?.grade ?? ''} – Bé {profile?.name || 'yêu'}
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.topGroup}>
        <Pill
          icon="⭐"
          label={wide ? `${rewards.stars} sao` : String(rewards.stars)}
          tint={Palette.amber}
          ink={Palette.amberInk}
          accessibilityLabel={`Con có ${rewards.stars} ngôi sao`}
        />
        <Pill
          icon="🔥"
          label={wide ? `${streak} ngày` : String(streak)}
          tint={Palette.coralSoft}
          ink={Palette.coralInk}
          accessibilityLabel={`Chuỗi ${streak} ngày học`}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Cổng phụ huynh"
          onPress={() => router.navigate('/tien-do')}
          style={({ pressed }) => [styles.parentPill, pressed && styles.pressed]}>
          <MaterialIcons name="family-restroom" size={20} color={Palette.blue} />
          {wide && <AppText variant="labelMd">Cổng Phụ Huynh</AppText>}
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Hồ sơ của bé"
          onPress={() => router.push('/sua-ho-so')}
          style={({ pressed }) => [styles.profileChip, wide && styles.profileChipWide, pressed && styles.pressed]}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarEmoji}>{avatarEmoji(profile?.avatar ?? '')}</AppText>
          </View>
          {wide && (
            <AppText variant="labelMd">{profile?.name || 'Bé yêu'}</AppText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },

  // --- Thanh tab dưới (điện thoại) ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderTopWidth: 2,
    borderColor: Palette.border,
    zIndex: 50,
  },
  bottomBarInner: {
    flexDirection: 'row',
    flexGrow: 1,
    maxWidth: NarrowContentWidth,
    paddingVertical: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  iconWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  iconWrapFocused: {
    backgroundColor: Palette.mint,
  },

  // --- Thanh icon (máy gập mở ra / tablet) ---
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: RailWidth,
    alignItems: 'center',
    gap: Spacing.four,
    backgroundColor: Palette.surfaceMuted,
    paddingVertical: Spacing.four,
    zIndex: 50,
  },
  railNav: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  railButton: {
    width: RailWidth - 12,
    alignItems: 'center',
    gap: Spacing.half,
  },

  // --- Thanh bên (máy tính) ---
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SidebarWidth,
    justifyContent: 'space-between',
    backgroundColor: Palette.surfaceMuted,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three + 4,
    zIndex: 50,
  },
  sidebarTop: {
    gap: Spacing.four,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.one,
  },
  brandName: {
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
  },
  statsDivider: {
    width: 1,
    height: 22,
    backgroundColor: Palette.border,
  },
  nav: {
    gap: Spacing.one + 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.full,
  },
  navItemFocused: {
    backgroundColor: Palette.mint,
  },
  safeCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
    gap: Spacing.one + 2,
  },
  safeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },

  // --- Thanh trên ---
  topBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: TopBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    backgroundColor: 'rgba(249,249,255,0.9)',
    zIndex: 40,
    // Chỉ có trên trình duyệt: làm mờ nội dung cuộn phía sau thanh trên.
    ...({ backdropFilter: 'blur(16px)' } as object),
  },
  topBarNarrow: {
    paddingHorizontal: Spacing.three + 4,
    justifyContent: 'flex-end',
  },
  topGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.amber,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  pillIcon: {
    fontSize: 15,
    lineHeight: 20,
  },
  parentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    backgroundColor: Palette.surfaceStrong,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    padding: Spacing.one,
  },
  profileChipWide: {
    paddingRight: Spacing.three,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
});
