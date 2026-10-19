import type { GradedItem } from '@/lib/grading';
import type { Teacher } from '@/lib/teacher';

// Bé làm lại một câu sai ngay ở màn Chữa bài: so đáp án mới với đáp án đúng,
// rồi soạn lời cô khen hoặc gợi ý. Đáp án chữ không khớp hẳn thì để cô (AI) xem.

/** 'ask': không tự so được (không có đáp án đúng, hoặc đáp án chữ khác cách viết) → hỏi cô. */
export type RetryVerdict = 'correct' | 'wrong' | 'ask';

type ParsedNumber = { value: number; unit: string };

function normalizeText(text: string) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/^["'“”‘’«»(\s]+|["'“”‘’«»)\s]+$/g, '')
    .replace(/[.!?;:,…]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "1.000" là một nghìn, "2,5" là hai phẩy năm (cách viết số của Việt Nam). */
function parseNumber(text: string): ParsedNumber | null {
  const match = normalizeText(text).match(/^([-+]?\d[\d.,\s]*?)\s*([\p{L}²³%]*)$/u);
  if (!match) return null;
  let digits = match[1].replace(/\s+/g, '');
  if (digits.includes('.') && digits.includes(',')) {
    digits = digits.replace(/\./g, '').replace(',', '.');
  } else if (digits.includes(',')) {
    digits = digits.replace(',', '.');
  } else if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(digits)) {
    digits = digits.replace(/\./g, '');
  }
  const value = Number(digits);
  return Number.isFinite(value) ? { value, unit: match[2] } : null;
}

/** Số trong đáp án; đáp án dạng phép tính "2 x 7 = 14" thì lấy kết quả sau dấu "=". */
function answerNumber(text: string): ParsedNumber | null {
  return parseNumber(text) ?? (text.includes('=') ? parseNumber(text.slice(text.lastIndexOf('=') + 1)) : null);
}

/** Đáp án đúng là số thì mở bàn phím số cho bé. */
export function isNumericAnswer(answer: string | undefined) {
  return !!answer && answerNumber(answer) !== null;
}

export function checkRetry(answer: string, correctAnswer: string | undefined): RetryVerdict {
  if (!correctAnswer?.trim()) return 'ask';
  const expected = answerNumber(correctAnswer);
  if (expected) {
    const given = answerNumber(answer);
    if (!given) return 'wrong';
    // Bé quên ghi đơn vị vẫn tính đúng; ghi sai đơn vị thì chưa đúng.
    const unitOk = !given.unit || given.unit === expected.unit;
    return given.value === expected.value && unitOk ? 'correct' : 'wrong';
  }
  const compact = (text: string) => normalizeText(text).replace(/\s+/g, '');
  return compact(answer) === compact(correctAnswer) ? 'correct' : 'ask';
}

const praises = [
  'Đúng rồi! Con tự sửa được rồi đấy, giỏi quá!',
  'Chính xác! Con làm lại đúng rồi nhé, giỏi lắm!',
  'Đúng rồi nha! Lần sau con nhớ cách này nhé.',
];

export function retryPraise(attempt: number) {
  return praises[attempt % praises.length];
}

/**
 * Lời cô khi bé làm lại vẫn sai. Lần đầu chỉ gợi ý, chưa nói đáp án;
 * từ lần thứ hai cô mới nói đáp án và giảng lại.
 */
export function retryHint(item: GradedItem, answer: string, attempt: number, teacher: Teacher) {
  if (attempt <= 1) {
    const expected = item.correctAnswer ? answerNumber(item.correctAnswer) : null;
    const given = answerNumber(answer);
    if (expected && given && expected.value !== given.value) {
      const direction = expected.value > given.value ? 'lớn hơn' : 'nhỏ hơn';
      return `Chưa đúng rồi con. Kết quả đúng ${direction} ${String(given.value).replace('.', ',')} đấy. Con tính lại thật chậm nhé, ${teacher.word} tin con làm được!`;
    }
    return `Chưa đúng rồi con. Con đọc lại đề thật chậm, rồi làm lại nhé, ${teacher.word} tin con làm được!`;
  }
  const answerPart = item.correctAnswer ? `Đáp án đúng là ${item.correctAnswer} nhé.` : '';
  return [`Gần được rồi con.`, answerPart, item.explanation, 'Con ghi lại vào vở cho nhớ nha.']
    .filter(Boolean)
    .join(' ');
}

/** Câu bé gửi cô khi cần cô xem giúp đáp án làm lại. */
export function retryQuestion(answer: string, teacher: Teacher) {
  return `Con làm lại được: ${answer.trim()}. Đúng chưa ${teacher.word}?`;
}
