import { useSyncExternalStore } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { answerWebAlert, currentWebAlert, subscribeWebAlert } from '@/lib/web-alert';

// Hộp thoại thay cho Alert.alert trên trình duyệt (xem lib/web-alert.ts). Trên điện thoại không làm gì.
export function WebAlertHost() {
  const alert = useSyncExternalStore(subscribeWebAlert, currentWebAlert, () => null);
  if (Platform.OS !== 'web' || !alert) return null;

  const cancel = alert.buttons.find((button) => button.style === 'cancel');

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => answerWebAlert(cancel)}>
      <View style={styles.backdrop}>
        <View accessibilityRole="alert" style={styles.dialog}>
          <AppText variant="headlineSm">{alert.title}</AppText>
          {!!alert.message && (
            <AppText variant="bodyMd" color={Palette.inkSoft}>
              {alert.message}
            </AppText>
          )}
          <View style={styles.buttons}>
            {alert.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const destructive = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  onPress={() => answerWebAlert(button)}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? styles.buttonGhost : destructive ? styles.buttonDanger : styles.buttonPrimary,
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    variant="labelLg"
                    color={isCancel ? Palette.blue : destructive ? Palette.coralDark : Palette.white}>
                    {button.text}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    backgroundColor: 'rgba(17,28,45,0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    gap: Spacing.three,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  buttonPrimary: {
    backgroundColor: Palette.blue,
    borderColor: Palette.blue,
  },
  buttonGhost: {
    backgroundColor: Palette.surface,
    borderColor: Palette.mint,
  },
  buttonDanger: {
    backgroundColor: Palette.coralSoft,
    borderColor: Palette.coralSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
