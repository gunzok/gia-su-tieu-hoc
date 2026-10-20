import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { speakable, type GradedItem, type Subject } from '@/lib/grading';
import { askTeacher } from '@/lib/hoi-co';
import { useTeacher } from '@/lib/profile';
import { checkRetry, isNumericAnswer, retryHint, retryPraise, retryQuestion } from '@/lib/retry-check';

type Props = {
  item: GradedItem;
  number: number;
  subject: Subject;
  grade: number;
  /** Lời cô ở phần làm lại đang được đọc. */
  speakingNow: boolean;
  speak: (text: string) => void;
  stopSpeech: () => void;
  /** Báo cho dòng câu hỏi che/hiện đáp án đúng trong lúc bé làm lại. */
  onHideAnswer: (hide: boolean) => void;
};

type Reply = { text: string; tone: 'correct' | 'wrong' | 'teacher' };

// Nút "Thử lại câu này" ở câu sai: bé gõ lại đáp án, cô báo đúng/sai và đọc to.
// Kết quả chỉ hiện trong lúc xem, chưa lưu vào lịch sử.
export function RetryQuestion({ item, number, subject, grade, speakingNow, speak, stopSpeech, onHideAnswer }: Props) {
  const T = useTeacher();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const numeric = isNumericAnswer(item.correctAnswer);

  function show(next: Reply) {
    setReply(next);
    speak(speakable(next.text));
  }

  function start() {
    setOpen(true);
    onHideAnswer(true);
  }

  function close() {
    stopSpeech();
    setOpen(false);
    onHideAnswer(false);
  }

  async function submit() {
    const answer = draft.trim();
    if (!answer || checking) return;
    const attempt = attempts + 1;
    setAttempts(attempt);
    const verdict = checkRetry(answer, item.correctAnswer);

    if (verdict === 'correct') {
      setSolved(true);
      onHideAnswer(false);
      show({ text: retryPraise(attempt), tone: 'correct' });
      return;
    }
    if (verdict === 'wrong') {
      // Lần sai thứ hai thì cô nói đáp án, nên hiện lại đáp án đúng trên dòng câu hỏi.
      if (attempt >= 2) onHideAnswer(false);
      show({ text: retryHint(item, answer, attempt, T), tone: 'wrong' });
      return;
    }

    stopSpeech();
    setChecking(true);
    setReply(null);
    try {
      const text = await askTeacher({
        subject,
        grade,
        teacher: T.id,
        item,
        turns: [{ role: 'user', content: retryQuestion(answer, T) }],
      });
      show({ text, tone: 'teacher' });
    } catch (error) {
      console.warn('Không hỏi được cô về câu làm lại:', error);
      show({
        text: `${T.Title} chưa xem được bài, con thử lại sau một chút nhé.`,
        tone: 'teacher',
      });
    } finally {
      setChecking(false);
    }
  }

  if (!open) {
    return <BigButton label="Thử lại câu này" icon="refresh" variant="ghost" onPress={start} />;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <AppText variant="labelLg" color={Palette.blueDark} style={styles.flex}>
          {solved ? `Con đã sửa đúng câu ${number}!` : `Con làm lại câu ${number} nào!`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng phần làm lại"
          onPress={close}
          hitSlop={6}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <MaterialIcons name="close" size={24} color={Palette.inkSoft} />
        </Pressable>
      </View>

      {!solved && (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Đáp án của con"
            placeholderTextColor={Palette.inkSoft}
            keyboardType={numeric ? 'decimal-pad' : 'default'}
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={120}
            editable={!checking}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={submit}
            accessibilityLabel={`Đáp án mới cho câu ${number}`}
            style={styles.input}
          />
          <BigButton
            label={`Nộp cho ${T.word}`}
            icon="check"
            onPress={submit}
            loading={checking}
            disabled={!draft.trim()}
          />
        </>
      )}

      {checking && (
        <AppText variant="bodyMd" color={Palette.inkSoft}>
          {T.Title} đang xem bài của con…
        </AppText>
      )}

      {reply && (
        <View style={[styles.reply, toneStyles[reply.tone]]}>
          <MaterialIcons
            name={
              reply.tone === 'correct'
                ? 'celebration'
                : reply.tone === 'wrong'
                  ? 'lightbulb-outline'
                  : 'record-voice-over'
            }
            size={24}
            color={reply.tone === 'wrong' ? Palette.coralInk : Palette.blueDark}
          />
          <AppText variant="bodyLg" style={styles.flex}>
            {reply.text}
          </AppText>
          <ItemSpeakButton
            number={number}
            speakingNow={speakingNow}
            onSpeak={() => (speakingNow ? stopSpeech() : speak(speakable(reply.text)))}
            label={`Nghe lại lời ${T.word}`}
          />
        </View>
      )}
    </View>
  );
}

const toneStyles = StyleSheet.create({
  correct: { backgroundColor: Palette.mintSoft },
  wrong: { backgroundColor: Palette.amberSoft },
  teacher: { backgroundColor: Palette.surfaceMuted },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  panel: {
    gap: Spacing.three,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.mint,
    padding: Spacing.three,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  close: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
  },
  input: {
    minHeight: 64,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderColor: Palette.mint,
    borderRadius: Radius.md + 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Palette.ink,
    textAlign: 'center',
  },
  reply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
