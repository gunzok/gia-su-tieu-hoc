import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, type ReactNode } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Card } from '@/components/card';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';

// Cổng phụ huynh (Apple/Google bắt buộc với app cho trẻ em): trước khi mua gói, quản lý gói
// hay xoá tài khoản, ba mẹ giải một phép nhân hai chữ số với một chữ số mà bé lớp 1–3 chưa làm được.

function newQuestion() {
  const a = 11 + Math.floor(Math.random() * 9); // 11–19
  const b = 3 + Math.floor(Math.random() * 7); // 3–9
  return { a, b, answer: a * b };
}

type GateProps = {
  /** Ba mẹ sắp làm gì, ví dụ "xem gói Plus". */
  purpose: string;
  onPass: () => void;
  onCancel: () => void;
};

export function ParentalGate({ purpose, onPass, onCancel }: GateProps) {
  const [question, setQuestion] = useState(newQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  function check() {
    if (Number(value) === question.answer) {
      onPass();
      return;
    }
    // Sai thì đổi phép tính khác để không đoán dần được.
    setWrong(true);
    setValue('');
    setQuestion(newQuestion());
  }

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.icon}>
          <MaterialIcons name="lock-outline" size={28} color={Palette.blue} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineSm">Dành cho ba mẹ</AppText>
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Để {purpose}, ba mẹ trả lời phép tính sau nhé.
          </AppText>
        </View>
      </View>

      <AppText variant="headlineLg" style={styles.question} accessibilityLabel={`${question.a} nhân ${question.b} bằng bao nhiêu?`}>
        {question.a} × {question.b} = ?
      </AppText>
      <TextInput
        value={value}
        onChangeText={(text) => {
          setValue(text.replace(/[^0-9]/g, ''));
          setWrong(false);
        }}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="Nhập kết quả"
        placeholderTextColor={Palette.inkSoft}
        returnKeyType="done"
        onSubmitEditing={check}
        accessibilityLabel="Kết quả phép tính"
        style={styles.input}
      />
      {wrong && (
        <AppText variant="bodySm" color={Palette.coralInk} style={styles.center}>
          Chưa đúng, ba mẹ thử phép tính mới nhé.
        </AppText>
      )}
      <BigButton label="Tiếp tục" icon="arrow-forward" iconAfter disabled={value.length === 0} onPress={check} />
      <BigButton label="Quay lại" variant="ghost" onPress={onCancel} />
    </Card>
  );
}

/** Hiện cổng phụ huynh dạng hộp nổi; qua được cổng thì mới chạy việc cần làm. */
export function useParentalGate(): { gate: ReactNode; requireParent: (purpose: string, action: () => void) => void } {
  const [pending, setPending] = useState<{ purpose: string; action: () => void } | null>(null);

  const gate = (
    <Modal visible={pending !== null} transparent animationType="fade" onRequestClose={() => setPending(null)}>
      <View style={styles.backdrop}>
        {pending && (
          <View style={styles.sheet}>
            <ParentalGate
              purpose={pending.purpose}
              onCancel={() => setPending(null)}
              onPass={() => {
                setPending(null);
                pending.action();
              }}
            />
          </View>
        )}
      </View>
    </Modal>
  );

  return { gate, requireParent: (purpose, action) => setPending({ purpose, action }) };
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    textAlign: 'center',
    marginVertical: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  input: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Palette.ink,
    textAlign: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.full,
    minHeight: 60,
    paddingHorizontal: Spacing.four,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three + 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
