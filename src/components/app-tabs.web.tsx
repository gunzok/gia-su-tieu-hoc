import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/app-text';
import type { IconName } from '@/components/big-button';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home">Trang chủ</TabButton>
          </TabTrigger>
          <TabTrigger name="quet-bai" href="/quet-bai" asChild>
            <TabButton icon="document-scanner">Quét bài</TabButton>
          </TabTrigger>
          <TabTrigger name="chua-bai" href="/chua-bai" asChild>
            <TabButton icon="auto-fix-high">Chữa bài</TabButton>
          </TabTrigger>
          <TabTrigger name="tien-do" href="/tien-do" asChild>
            <TabButton icon="emoji-events">Tiến độ</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: IconName }) {
  return (
    <Pressable {...(props as PressableProps)} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, isFocused && styles.iconWrapFocused]}>
        <MaterialIcons name={icon} size={24} color={isFocused ? Palette.blueDark : Palette.inkSoft} />
      </View>
      <AppText variant="labelSm" color={isFocused ? Palette.blueDark : Palette.inkSoft}>
        {children}
      </AppText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderTopWidth: 2,
    borderColor: Palette.border,
  },
  innerContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    paddingVertical: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  iconWrapFocused: {
    backgroundColor: Palette.mintSoft,
  },
});
