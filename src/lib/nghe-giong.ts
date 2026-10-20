import type { ExpoSpeechRecognitionErrorCode } from 'expo-speech-recognition';

// Bé bấm mic nói câu hỏi cho cô: phần logic thuần (không gọi máy), để test được.

/**
 * Ghép chữ máy nghe được vào sau phần bé đã gõ sẵn trong ô (base).
 * Mỗi lần máy nghe thêm, transcript là cả câu từ đầu nên luôn ghép lại từ base, không cộng dồn.
 */
export function withTranscript(base: string, transcript: string, maxChars: number) {
  const heard = transcript.trim();
  if (!heard) return base;
  const start = base.trimEnd();
  return (start ? `${start} ${heard}` : heard).slice(0, maxChars);
}

/** Lời nhắn nhẹ nhàng khi mic không dùng được; null nếu không cần báo (bé tự dừng). */
export function micErrorMessage(code: ExpoSpeechRecognitionErrorCode, word: string): string | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'not-allowed':
      return `Con chưa cho phép dùng micro. Con cứ gõ câu hỏi nhé, hoặc nhờ bố mẹ bật micro cho app trong Cài đặt.`;
    case 'no-speech':
    case 'speech-timeout':
      return `${capitalize(word)} chưa nghe rõ. Con bấm mic rồi nói lại to hơn một chút nhé!`;
    case 'language-not-supported':
    case 'service-not-allowed':
      return `Máy này chưa nghe được tiếng Việt. Con gõ câu hỏi cho ${word} nhé!`;
    case 'network':
      return `Nghe giọng cần Internet. Con nhờ bố mẹ kiểm tra mạng, hoặc gõ câu hỏi cho ${word} nhé.`;
    default:
      return `Micro đang bận một chút. Con gõ câu hỏi cho ${word} nhé!`;
  }
}

/** Máy không nhận được giọng tiếng Việt: ẩn nút mic cho đỡ rối. */
export function micUnsupported(code: ExpoSpeechRecognitionErrorCode) {
  return code === 'language-not-supported' || code === 'service-not-allowed';
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
