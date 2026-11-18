import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ItemSpeakButton } from '@/components/item-speak-button';
import { Mascot } from '@/components/mascot';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { SubjectNames, type Subject } from '@/lib/grading';
import { ASK_LIMITS, askTeacher, suggestedQuestions, type AskItem, type AskTurn } from '@/lib/hoi-co';
import { useTeacher } from '@/lib/profile';
import { speakVietnamese, stopSpeaking } from '@/lib/speech';
import { useLayout } from '@/web/use-layout';
import { speakTimeoutMs, vietnameseVoiceSupport, type VoiceSupport } from '@/web/web-voice';

type Params = { item?: string; number?: string; subject?: string; grade?: string };

/** Bề ngang tối đa của màn Hỏi cô trên máy tính (hai cột). */
const MAX_WIDTH = 1120;

function parseItem(raw: string | undefined): AskItem | null {
  try {
    const item = raw ? (JSON.parse(raw) as AskItem) : null;
    return item && typeof item.question === 'string' ? item : null;
  } catch {
    return null;
  }
}

function close() {
  stopSpeaking();
  if (router.canGoBack()) router.back();
  else router.replace('/chua-bai');
}

// Hỏi cô trên trình duyệt (GIA-74). Màn rộng: cột trái là câu đang hỏi + câu hỏi gợi ý, cột phải là khung trò chuyện.
// Màn hẹp: một cột như app. Logic hỏi cô giống app (src/app/hoi-co.tsx); trình duyệt chưa có nhận giọng nói nên không có mic.
export default function AskTeacherWeb() {
  const params = useLocalSearchParams<Params>();
  const T = useTeacher();
  const { narrow, medium } = useLayout();
  const item = useMemo(() => parseItem(params.item), [params.item]);
  const number = Number(params.number) || 1;
  const subject: Subject = params.subject === 'tieng-viet' ? 'tieng-viet' : 'toan';
  const grade = Math.min(5, Math.max(1, Number(params.grade) || 1));

  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voice, setVoice] = useState<VoiceSupport | null>(null);
  const [voiceNoticeHidden, setVoiceNoticeHidden] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    vietnameseVoiceSupport().then((support) => alive && setVoice(support));
    return () => {
      alive = false;
      if (speakTimer.current) clearTimeout(speakTimer.current);
      stopSpeaking();
    };
  }, []);

  // Phím Esc đóng màn Hỏi cô (giống đóng hộp thoại).
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.defaultPrevented) close();
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  function finishSpeaking(index: number) {
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = null;
    setSpeakingIndex((current) => (current === index ? null : current));
  }

  function speak(index: number, text: string) {
    setSpeakingIndex(index);
    if (speakTimer.current) clearTimeout(speakTimer.current);
    // Trình duyệt có khi không báo đọc xong (thiếu giọng, bị chặn tự phát tiếng): tự trả nút loa về sau một lúc.
    speakTimer.current = setTimeout(() => finishSpeaking(index), speakTimeoutMs(text));
    speakVietnamese(text, { onDone: () => finishSpeaking(index) }, T.id).catch(() => finishSpeaking(index));
  }

  function toggleSpeak(index: number, text: string) {
    if (speakingIndex === index) {
      stopSpeaking();
      finishSpeaking(index);
    } else {
      speak(index, text);
    }
  }

  const questionsLeft = Math.floor((ASK_LIMITS.maxTurns + 1) / 2) - Math.ceil(turns.length / 2);
  const canAsk = !!item && questionsLeft > 0;

  async function ask(question: string) {
    const text = question.trim().slice(0, ASK_LIMITS.maxChars);
    if (!item || !text || thinking || questionsLeft <= 0) return;
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
      setTurns(turns);
      setDraft(text);
      setFailed(true);
    } finally {
      setThinking(false);
    }
  }

  const greeting = `Con muốn hỏi ${T.word} gì về câu ${number}? Con chọn một câu gợi ý hoặc tự gõ nhé!`;
  const suggestions = item ? suggestedQuestions(item, T.Title) : [];
  const showVoiceNotice = !voiceNoticeHidden && (voice === 'khong' || voice === 'khong-ho-tro');

  const itemCard = item ? (
    <View
      style={[styles.itemCard, { backgroundColor: item.correct ? Palette.mintSoft : Palette.coralSoft }]}
      accessibilityLabel={`Câu ${number}: ${item.question}`}>
      <AppText variant="labelMd" color={item.correct ? Palette.blueDark : Palette.coralInk}>
        Câu {number} · {item.correct ? 'Con làm đúng' : 'Con làm chưa đúng'}
      </AppText>
      <AppText variant={narrow ? 'labelLg' : 'headlineSm'}>{item.question}</AppText>
      <AppText variant="bodyMd">Con làm: {item.childAnswer}</AppText>
      {!item.correct && !!item.correctAnswer && <AppText variant="bodyMd">Đúng là: {item.correctAnswer}</AppText>}
    </View>
  ) : (
    <AppText variant="bodyMd" color={Palette.inkSoft}>
      Không tìm thấy câu này, con quay lại bài chấm nhé.
    </AppText>
  );

  const voiceNotice = showVoiceNotice && (
    <View style={styles.notice} accessibilityRole="alert">
      <MaterialIcons name="info-outline" size={20} color={Palette.amberInk} />
      <AppText variant="bodySm" color={Palette.amberInk} style={styles.flex}>
        {voice === 'khong-ho-tro'
          ? `Trình duyệt này không đọc được thành tiếng. Nếu không nghe thấy ${T.word}, con đọc chữ nhé.`
          : `Trình duyệt này chưa có giọng tiếng Việt. Nếu không nghe thấy ${T.word}, con đọc chữ nhé.`}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ẩn lời nhắn"
        onPress={() => setVoiceNoticeHidden(true)}
        style={({ pressed }) => [styles.noticeClose, pressed && styles.pressed]}>
        <MaterialIcons name="close" size={20} color={Palette.amberInk} />
      </Pressable>
    </View>
  );

  const suggestionList = canAsk && !thinking && (
    <View style={[styles.chips, !narrow && styles.chipsColumn]}>
      {suggestions.map((question) => (
        <Pressable
          key={question}
          accessibilityRole="button"
          onPress={() => ask(question)}
          style={({ pressed }) => [styles.chip, !narrow && styles.chipWide, pressed && styles.pressed]}>
          {!narrow && <MaterialIcons name="chat-bubble-outline" size={18} color={Palette.blueDark} />}
          <AppText variant="labelLg" color={Palette.blueDark} style={!narrow && styles.flex}>
            {question}
          </AppText>
        </Pressable>
      ))}
    </View>
  );

  const messages = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.messages, !narrow && styles.messagesWide]}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
      {narrow && itemCard}
      <TeacherBubble text={greeting} speaking={speakingIndex === -1} onSpeak={() => toggleSpeak(-1, greeting)} />
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
        <View style={styles.thinking} accessibilityLiveRegion="polite">
          <ActivityIndicator color={Palette.blue} />
          <AppText variant="bodyMd" color={Palette.inkSoft}>
            {T.Title} đang nghĩ…
          </AppText>
        </View>
      )}
      {failed && (
        <View style={styles.error} accessibilityRole="alert">
          <AppText variant="bodyMd" color={Palette.coralDark}>
            Kết nối đang có vấn đề. Con nhờ bố mẹ kiểm tra Internet rồi hỏi lại {T.word} nhé.
          </AppText>
        </View>
      )}
    </ScrollView>
  );

  const sendDisabled = thinking || !draft.trim();
  const composer = canAsk ? (
    <View style={styles.inputRow}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={`Con gõ câu hỏi cho ${T.word}…`}
        placeholderTextColor={Palette.inkSoft}
        accessibilityLabel={`Câu hỏi cho ${T.word}`}
        maxLength={ASK_LIMITS.maxChars}
        editable={!thinking}
        autoFocus={!narrow}
        style={styles.input}
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={() => ask(draft)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Gửi câu hỏi cho ${T.word}`}
        accessibilityState={{ disabled: sendDisabled }}
        disabled={sendDisabled}
        onPress={() => ask(draft)}
        style={({ pressed }) => [styles.send, sendDisabled && styles.sendDisabled, pressed && styles.pressed]}>
        <MaterialIcons name="send" size={24} color={sendDisabled ? Palette.inkSoft : Palette.white} />
      </Pressable>
    </View>
  ) : (
    item && (
      <AppText variant="bodyMd" color={Palette.inkSoft} style={styles.center}>
        Hôm nay con hỏi nhiều rồi, giỏi lắm! Con thử làm câu tiếp theo nhé.
      </AppText>
    )
  );

  const header = (
    <View style={[styles.header, narrow && styles.headerNarrow]}>
      <Mascot size={narrow ? 48 : 64} />
      <View style={styles.flex}>
        <AppText variant={narrow ? 'headlineSm' : 'headlineLg'} accessibilityRole="header">
          Hỏi {T.word}
        </AppText>
        <AppText variant="bodyMd" color={Palette.inkSoft}>
          Câu {number} · {SubjectNames[subject]} lớp {grade}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        accessibilityHint="Phím Esc cũng đóng được"
        onPress={close}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
        <MaterialIcons name="close" size={26} color={Palette.ink} />
      </Pressable>
    </View>
  );

  if (narrow) {
    return (
      <View style={styles.page}>
        {header}
        {messages}
        <View style={styles.footer}>
          {voiceNotice}
          {suggestionList}
          {composer}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={[styles.wideInner, { maxWidth: MAX_WIDTH }]}>
        {header}
        <View style={styles.body}>
          <ScrollView
            style={[styles.aside, { width: medium ? 300 : 380 }]}
            contentContainerStyle={styles.asideContent}>
            {itemCard}
            {canAsk && !thinking && (
              <AppText variant="labelLg" color={Palette.inkSoft}>
                Gợi ý câu hỏi
              </AppText>
            )}
            {suggestionList}
            {voiceNotice}
            {canAsk && (
              <AppText variant="bodySm" color={Palette.inkSoft}>
                Con còn hỏi được {questionsLeft} câu nữa.
              </AppText>
            )}
          </ScrollView>
          <View style={styles.chat}>
            {messages}
            <View style={styles.chatFooter}>{composer}</View>
          </View>
        </View>
      </View>
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
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  wideInner: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  headerNarrow: {
    alignSelf: 'stretch',
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
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.four,
    minHeight: 0,
  },
  aside: {
    flexGrow: 0,
    flexShrink: 0,
  },
  asideContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  chat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  chatFooter: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  messages: {
    paddingHorizontal: Spacing.three + 4,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  messagesWide: {
    padding: Spacing.four,
  },
  itemCard: {
    borderRadius: Radius.md,
    padding: Spacing.three + 4,
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
    maxWidth: 640,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md + 4,
    borderBottomLeftRadius: 4,
    padding: Spacing.three,
  },
  childBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
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
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.background,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipsColumn: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: Palette.mintSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  chipWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
  },
  noticeClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: Palette.blue,
    borderRadius: Radius.md + 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Palette.ink,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Không làm mờ cả nút (chữ/biểu tượng mờ không đủ tương phản): đổi sang nền xám nhạt, biểu tượng xám đậm.
  sendDisabled: {
    backgroundColor: Palette.surfaceStrong,
  },
});
