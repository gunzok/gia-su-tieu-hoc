import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { Palette, Spacing } from '@/constants/theme';
import { signOut, useAuth } from '@/lib/auth';

// Thẻ tài khoản ở tab Tiến độ: mời ba mẹ đăng nhập để lưu kết quả lên máy chủ, hoặc đăng xuất.
export function AccountCard() {
  const { configured, user, signedIn } = useAuth();
  if (!configured) return null;

  function confirmSignOut() {
    Alert.alert('Đăng xuất?', 'Kết quả đã lưu trên máy này vẫn còn. Đăng nhập lại để xem trên máy khác.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => signOut().catch((error) => Alert.alert('Chưa đăng xuất được', String(error))),
      },
    ]);
  }

  return (
    <Card tint={signedIn ? Palette.mintSoft : Palette.surfaceStrong} borderColor="transparent">
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons name={signedIn ? 'cloud-done' : 'cloud-upload'} size={24} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelLg">{signedIn ? 'Đã lưu lên máy chủ' : 'Lưu kết quả của bé an toàn'}</AppText>
          <AppText variant="bodySm" color={Palette.inkSoft}>
            {signedIn
              ? `Ba mẹ đăng nhập bằng ${user?.email ?? 'tài khoản Google'}`
              : 'Đăng nhập để xem lại kết quả trên máy khác và không mất khi đổi máy.'}
          </AppText>
        </View>
      </View>
      {signedIn ? (
        <BigButton label="Đăng xuất" variant="ghost" icon="logout" compact onPress={confirmSignOut} />
      ) : (
        <BigButton label="Ba mẹ đăng nhập" icon="login" onPress={() => router.push('/dang-nhap')} />
      )}
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
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
