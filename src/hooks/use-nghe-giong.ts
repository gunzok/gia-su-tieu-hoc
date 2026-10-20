import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionErrorCode, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { micErrorMessage, micUnsupported, withTranscript } from '@/lib/nghe-giong';

// Nhận giọng nói tiếng Việt có sẵn trên máy (Apple / Google xử lý).
// Bản app chưa build lại hoặc bản web không có mã gốc này: native là null và nút mic được ẩn.
const native = requireOptionalNativeModule<typeof ExpoSpeechRecognitionModule>('ExpoSpeechRecognition');

function recognitionAvailable() {
  try {
    return native?.isRecognitionAvailable() ?? false;
  } catch {
    return false;
  }
}

// Nhận giọng đổi phiên âm thanh của iPhone sang chế độ thu âm (tiếng phát ra nhỏ đi).
// Nghe xong thì trả về chế độ phát như cũ để giọng cô vẫn to, rõ.
function restorePlayback() {
  if (Platform.OS !== 'ios' || !native) return;
  try {
    native.setCategoryIOS({ category: 'playback', categoryOptions: [], mode: 'default' });
  } catch (error) {
    console.warn('Chưa trả lại được chế độ phát âm thanh:', error);
  }
}

type Phase = 'idle' | 'asking' | 'listening';

type Options = {
  /** Chữ trong ô nhập sau khi ghép thêm phần bé vừa nói. */
  onText: (text: string) => void;
  maxChars: number;
  /** "cô" hoặc "thầy", dùng trong lời nhắn. */
  word: string;
};

/**
 * Bé bấm mic nói câu hỏi: chữ hiện dần vào ô nhập (nối sau phần đã gõ), nói xong thì tự dừng.
 * Không tự gửi: bé xem, sửa rồi bấm gửi.
 */
export function useNgheGiong({ onText, maxChars, word }: Options) {
  const [available, setAvailable] = useState(recognitionAvailable);
  const [phase, setPhase] = useState<Phase>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const phaseRef = useRef<Phase>('idle');
  // Chữ có sẵn trong ô lúc bắt đầu nói.
  const baseRef = useRef('');
  // Bé đã gửi câu hỏi giữa chừng: bỏ qua chữ máy còn gửi về sau đó.
  const ignoreRef = useRef(false);

  function changePhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  const onResult = useEffectEvent((transcript: string) => {
    if (ignoreRef.current) return;
    onText(withTranscript(baseRef.current, transcript, maxChars));
  });
  const onProblem = useEffectEvent((message: string | null) => {
    if (message) setNotice(message);
  });
  const onError = useEffectEvent((code: ExpoSpeechRecognitionErrorCode, detail: string) => {
    if (code !== 'aborted') console.warn('Nhận giọng chưa được:', code, detail);
    if (micUnsupported(code)) setAvailable(false);
    onProblem(micErrorMessage(code, word));
  });
  const onEnd = useEffectEvent(() => {
    changePhase('idle');
    restorePlayback();
  });

  useEffect(() => {
    if (!native) return;
    const subscriptions = [
      native.addListener('result', (event) => onResult(event.results[0]?.transcript ?? '')),
      native.addListener('nomatch', () => onProblem(micErrorMessage('no-speech', word))),
      native.addListener('error', (event) => onError(event.error, event.message)),
      native.addListener('end', () => onEnd()),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      // Rời màn hình khi đang nghe: tắt mic luôn.
      if (phaseRef.current === 'listening') {
        native.abort();
        restorePlayback();
      }
    };
  }, [word]);

  async function start(base: string) {
    if (!native || phaseRef.current !== 'idle') return;
    baseRef.current = base;
    ignoreRef.current = false;
    setNotice(null);
    changePhase('asking');
    try {
      const permission = await native.requestPermissionsAsync();
      if (!permission.granted) {
        changePhase('idle');
        setNotice(micErrorMessage('not-allowed', word));
        return;
      }
      changePhase('listening');
      native.start({
        lang: 'vi-VN',
        interimResults: true,
        // Bé ngừng nói thì máy tự dừng nghe.
        continuous: false,
        addsPunctuation: true,
        iosTaskHint: 'dictation',
      });
    } catch (error) {
      console.warn('Chưa bật được micro:', error);
      changePhase('idle');
      setNotice(micErrorMessage('audio-capture', word));
    }
  }

  /** Bé bấm mic lần nữa: dừng và giữ chữ đã nghe được. */
  function stop() {
    if (phaseRef.current === 'listening') native?.stop();
  }

  /** Bé gửi câu hỏi khi đang nói: bỏ phần đang nghe dở để không ghi đè lên ô trống. */
  function cancel() {
    ignoreRef.current = true;
    if (phaseRef.current === 'listening') native?.abort();
  }

  return {
    available,
    listening: phase === 'listening',
    busy: phase !== 'idle',
    notice,
    clearNotice: () => setNotice(null),
    toggle: (base: string) => (phaseRef.current === 'idle' ? start(base) : stop()),
    cancel,
  };
}
