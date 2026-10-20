import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { useParentalGate } from '@/components/parental-gate';
import { Palette, Spacing } from '@/constants/theme';
import { deleteAccount } from '@/lib/auth';
import { clearLocalHistory } from '@/lib/history';
import { useProfile } from '@/lib/profile';

// Thẻ ở tab Tiến độ (dành cho ba mẹ): xem Chính sách quyền riêng tư, xoá tài khoản & dữ liệu.
export function PrivacyCard() {
  const { clearProfile } = useProfile();
  const { gate, requireParent } = useParentalGate();
  const [deleting, setDeleting] = useState(false);

  async function deleteEverything() {
    setDeleting(true);
    try {
      await deleteAccount();
      await clearLocalHistory();
      // Không còn hồ sơ bé thì app tự quay về màn Khởi động.
      await clearProfile();
    } catch (error) {
      Alert.alert('Chưa xoá được', error instanceof Error ? error.message : String(error));
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Xoá tài khoản & dữ liệu?',
      'Hồ sơ của bé, toàn bộ bài đã chấm và ảnh bài làm sẽ bị xoá vĩnh viễn trên máy chủ và trên máy này. ' +
        'Gói Plus (nếu có) không tự huỷ: ba mẹ huỷ trong App Store / Google Play.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá vĩnh viễn', style: 'destructive', onPress: deleteEverything },
      ],
    );
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons name="privacy-tip" size={24} color={Palette.blue} />
        </View>
        <AppText variant="labelLg" style={styles.flex}>
          Quyền riêng tư & dữ liệu
        </AppText>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/chinh-sach-rieng-tu')}
        style={styles.link}>
        <AppText variant="labelLg" color={Palette.blue} style={styles.flex}>
          Chính sách quyền riêng tư
        </AppText>
        <MaterialIcons name="chevron-right" size={24} color={Palette.blue} />
      </Pressable>
      <BigButton
        label="Xoá tài khoản & dữ liệu"
        icon="delete-forever"
        variant="coral"
        compact
        loading={deleting}
        onPress={() => requireParent('xoá tài khoản và dữ liệu', confirmDelete)}
      />
      {gate}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
});
