import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { PulseRing, SoundWave } from '@/components/sound-wave';
import { FontFamily, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { useNgheGiong } from '@/hooks/use-nghe-giong';
import { type Subject } from '@/lib/grading';
import { ASK_LIMITS, askTeacher, suggestedQuestions, type AskItem, type AskTurn } from '@/lib/hoi-co';
import { useTeacher } from '@/lib/profile';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';

type Params = { item?: string; number?: string; subject?: string; grade?: string };

function parseItem(raw: string | undefined): AskItem | null {
  try {
    const item = raw ? (JSON.parse(raw) as AskItem) : null;
    return item && typeof item.question === 'string' ? item : null;
  } catch {
    return null;
  }
}

// Bé hỏi thêm cô về một câu: chọn câu hỏi gợi ý hoặc tự gõ; cô trả lời bằng chữ và đọc to.
export default function AskTeacherScreen() {
  const params = useLocalSearchParams<Params>();
  const T = useTeacher();
  const item = useMemo(() => parseItem(params.item), [params.item]);
  const number = Number(params.number) || 1;
  const subject: Subject = params.subject === 'tieng-viet' ? 'tieng-viet' : 'toan';
  const grade = Math.min(5, Math.max(1, Number(params.grade) || 1));

  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [failed, setFailed] = useState(false);
  // Lượt nào đang được đọc (vị trí trong turns), null nếu không đọc.
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const mic = useNgheGiong({ onText: setDraft, maxChars: ASK_LIMITS.maxChars, word: T.word });

  useEffect(() => stopSpeaking, []);

  function speak(index: number, text: string) {
    setSpeakingIndex(index);
    speakVietnamese(text, { onDone: () => setSpeakingIndex((current) => (current === index ? null : current)) }, T.id);
  }

  function toggleSpeak(index: number, text: string) {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      speak(index, text);
    }
  }

  // Bé hỏi tối đa (maxTurns + 1) / 2 câu mỗi lần mở, để cuộc trò chuyện không quá dài.
  const questionsLeft = Math.floor((ASK_LIMITS.maxTurns + 1) / 2) - Math.ceil(turns.length / 2);

  async function ask(question: string) {
    const text = question.trim().slice(0, ASK_LIMITS.maxChars);
    if (!item || !text || thinking || questionsLeft <= 0) return;
    mic.cancel();
    stopSpeaking();
    setSpeakingIndex(null);
    setFailed(false);
    const next: AskTurn[] = [...turns, { role: 'user', content: text }];
    setTurns(next);
    setDraft('');
    setThinking(true);
    try {
      const answer = await askTeacher({ subject, grade, teacher: T.id, item, turns: next });
      setTurns([...next, { role: 'assistant', content: answer }]);
      speak(next.length, answer);
    } catch (error) {
      console.warn('Chưa hỏi được cô:', error);
      // Bỏ câu vừa hỏi để bé hỏi lại được; giữ chữ trong ô gõ.
      setTurns(turns);
      setDraft(text);
      setFailed(true);
    } finally {
      setThinking(false);
    }
  }

  // Bấm mic: cô đang đọc thì im để mic không thu lại giọng cô.
  function toggleMic() {
    if (!mic.listening) {
      stopSpeaking();
      setSpeakingIndex(null);
    }
    mic.toggle(draft);
  }

  const greeting = mic.available
    ? `Con muốn hỏi ${T.word} gì về câu ${number}? Con chọn một câu bên dưới, bấm mic để nói hoặc tự gõ nhé!`
    : `Con muốn hỏi ${T.word} gì về câu ${number}? Con chọn một câu bên dưới hoặc tự gõ nhé!`;
  const suggestions = item ? suggestedQuestions(item, T.Title) : [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Mascot size={48} />
          <View style={styles.flex}>
            <AppText variant="headlineSm">Hỏi {T.word}</AppText>
            <AppText variant="bodySm" color={Palette.inkSoft}>
              Câu {number}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/chua-bai'))}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={26} color={Palette.ink} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {item ? (
              <View style={[styles.itemCard, { backgroundColor: item.correct ? Palette.mintSoft : Palette.coralSoft }]}>
                <AppText variant="labelLg">{item.question}</AppText>
                <AppText variant="bodySm">
                  Con làm: {item.childAnswer}
                  {!item.correct && item.correctAnswer ? `  •  Đúng là: ${item.correctAnswer}` : ''}
                </AppText>
              </View>
            ) : (
              <AppText variant="bodyMd" color={Palette.inkSoft}>
                Không tìm thấy câu này, con quay lại bài chấm nhé.
              </AppText>
            )}

            <TeacherBubble
              text={greeting}
              speaking={speakingIndex === -1}
              onSpeak={() => toggleSpeak(-1, greeting)}
            />

            {turns.map((turn, index) =>
              turn.role === 'user' ? (
                <View key={index} style={styles.childBubble}>
                  <AppText variant="bodyLg" color={Palette.white}>
                    {turn.content}
                  </AppText>
                </View>
              ) : (
                <TeacherBubble
                  key={index}
                  text={turn.content}
                  speaking={speakingIndex === index}
                  onSpeak={() => toggleSpeak(index, turn.content)}
                />
              ),
            )}

            {thinking && (
              <View style={styles.thinking}>
                <ActivityIndicator color={Palette.blue} />
                <AppText variant="bodyMd" color={Palette.inkSoft}>
                  {T.Title} đang nghĩ…
                </AppText>
              </View>
            )}

            {failed && (
              <View style={styles.error}>
                <AppText variant="bodyMd" color={Palette.coralDark}>
                  Kết nối đang có vấn đề. Con nhờ bố mẹ kiểm tra Internet rồi hỏi lại {T.word} nhé.
                </AppText>
              </View>
            )}
          </ScrollView>

          {item && questionsLeft > 0 ? (
            <View style={styles.footer}>
              {!thinking && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  keyboardShouldPersistTaps="handled">
                  {suggestions.map((question) => (
                    <Pressable
                      key={question}
                      accessibilityRole="button"
                      onPress={() => ask(question)}
                      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                      <AppText variant="labelMd" color={Palette.blueDark}>
                        {question}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {mic.listening && (
                <View style={styles.listening} accessibilityLiveRegion="polite">
                  <SoundWave
                    active
                    heights={[14, 22, 16, 24, 12]}
                    colors={[Palette.coralDark, Palette.coral]}
                    barWidth={4}
                    gap={4}
                  />
                  <AppText variant="labelMd" color={Palette.coralInk}>
                    {T.Title} đang nghe, con nói đi! Nói xong bấm nút đỏ.
                  </AppText>
                </View>
              )}
              {mic.notice && !mic.listening && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Bấm để ẩn lời nhắn"
                  onPress={mic.clearNotice}
                  style={styles.notice}>
                  <AppText variant="bodySm" color={Palette.amberInk}>
                    {mic.notice}
                  </AppText>
                </Pressable>
              )}
              <View style={styles.inputRow}>
                {mic.available && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={mic.listening ? 'Dừng nghe' : `Nói câu hỏi cho ${T.word}`}
                    accessibilityHint={mic.listening ? 'Giữ lại chữ đã nghe để con xem rồi gửi' : 'Bấm rồi nói, chữ sẽ hiện trong ô'}
                    accessibilityState={{ disabled: thinking, busy: mic.busy && !mic.listening }}
                    disabled={thinking}
                    onPress={toggleMic}
                    style={({ pressed }) => [
                      styles.mic,
                      mic.listening && styles.micListening,
                      thinking && styles.sendDisabled,
                      pressed && styles.pressed,
                    ]}>
                    <PulseRing active={mic.listening} size={52} color={Palette.coralDark} />
                    <MaterialIcons
                      name={mic.listening ? 'stop' : 'mic'}
                      size={28}
                      color={mic.listening ? Palette.white : Palette.blueDark}
                    />
                  </Pressable>
                )}
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={mic.listening ? 'Chữ con nói sẽ hiện ở đây…' : `Con gõ câu hỏi cho ${T.word}…`}
                  placeholderTextColor={Palette.inkSoft}
                  maxLength={ASK_LIMITS.maxChars}
                  editable={!thinking && !mic.listening}
                  style={styles.input}
                  returnKeyType="send"
                  // Một dòng: phím "Gửi"/Enter gửi câu hỏi luôn, không xuống dòng.
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={() => ask(draft)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Gửi câu hỏi cho ${T.word}`}
                  disabled={thinking || !draft.trim()}
                  onPress={() => ask(draft)}
                  style={({ pressed }) => [
                    styles.send,
                    (thinking || !draft.trim()) && styles.sendDisabled,
                    pressed && styles.pressed,
                  ]}>
                  <MaterialIcons name="send" size={24} color={Palette.white} />
                </Pressable>
              </View>
            </View>
          ) : (
            item && (
              <View style={styles.footer}>
                <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
                  Hôm nay con hỏi nhiều rồi, giỏi lắm! Con thử làm câu tiếp theo nhé.
                </AppText>
              </View>
            )
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function TeacherBubble({ text, speaking, onSpeak }: { text: string; speaking: boolean; onSpeak: () => void }) {
  const T = useTeacher();
  return (
    <View style={styles.teacherRow}>
      <View style={styles.teacherBubble}>
        <AppText variant="bodyLg">{text}</AppText>
      </View>
      <ItemSpeakButton number={0} speakingNow={speaking} onSpeak={onSpeak} label={`Nghe ${T.word} nói`} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.three,
  },
  close: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingHorizontal: Spacing.three + 4,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  itemCard: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  teacherBubble: {
    flexShrink: 1,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md + 4,
    borderBottomLeftRadius: 4,
    padding: Spacing.three,
  },
  childBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: Palette.blue,
    borderRadius: Radius.md + 4,
    borderBottomRightRadius: 4,
    padding: Spacing.three,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  error: {
    backgroundColor: Palette.coralSoft,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.background,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two + 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 52,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderColor: Palette.mint,
    borderRadius: Radius.md + 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Palette.ink,
  },
  listening: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.coralSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  notice: {
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  mic: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.mintSoft,
    borderWidth: 2,
    borderColor: Palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micListening: {
    backgroundColor: Palette.coralDark,
    borderColor: Palette.coralDark,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
