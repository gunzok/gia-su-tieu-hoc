import { NativeTabs } from 'expo-router/native-tabs';

import { Palette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Palette.surface}
      indicatorColor={Palette.blueSoft}
      iconColor={{ default: Palette.inkSoft, selected: Palette.blue }}
      labelStyle={{
        default: { color: Palette.inkSoft },
        selected: { color: Palette.blueDark },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Trang chủ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quet-bai">
        <NativeTabs.Trigger.Label>Quét bài</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="doc.viewfinder" md="document_scanner" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chua-bai">
        <NativeTabs.Trigger.Label>Chữa bài</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="waveform" md="graphic_eq" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tien-do">
        <NativeTabs.Trigger.Label>Tiến độ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'rosette', selected: 'rosette' }}
          md="military_tech"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
