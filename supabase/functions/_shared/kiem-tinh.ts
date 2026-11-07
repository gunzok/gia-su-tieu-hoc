// Code tự tính đáp án Toán (GIA-53): tìm các phép tính trên một dòng chữ đọc được từ ảnh
// (ví dụ "d) 16 - 9 = 8", "b) 67 > 76") rồi tính lại bằng code, không nhờ AI tính.
// Dùng chung cho app và máy chủ nên không import gì.

export type CheckedCalculation = {
  /** Phép tính như trên trang, đã chuẩn hoá dấu (ví dụ "16 - 9 = 8"). */
  text: string;
  /** Phép tính viết sẵn đáp án đúng (ví dụ "16 - 9 = 7", "67 < 76"). */
  solved: string;
  /** Số hoặc dấu bé viết; null nếu máy không đọc thấy (ô trống, chữ viết tay khó đọc). */
  childAnswer: string | null;
  /** Đáp án đúng do code tính. */
  correctAnswer: string;
  /** null khi không đọc thấy câu trả lời của bé. */
  correct: boolean | null;
};

const opPattern = '[+\\-−x×*:÷]';
// Số lớn viết tách nhóm ("10 000", "1.500"), hoặc số thường, số thập phân ("1,5").
const number = '(?:\\d{1,3}(?:[ .]\\d{3})+(?!\\d)|\\d+(?:[.,]\\d+)?)';
// Không dính vào phân số ("3/4") hay chữ số khác.
const before = '(?<![\\d/.,])';
const after = '(?![\\d/])';
// "a op b (op c …) = kết quả"; bé chưa viết hoặc máy không đọc được thì không có kết quả.
const equation = new RegExp(`${before}(${number}(?:\\s*${opPattern}\\s*${number})+)\\s*=\\s*(${number})?${after}`, 'g');
// "a > b", "a < b", "a = b" (bài điền dấu): hai số đứng riêng, không thuộc phép tính dài hơn.
const comparison = new RegExp(
  `(?<![\\d/.,+\\-−x×*:÷=]\\s*)(${number})\\s*([<>=])\\s*(${number})(?!\\s*[\\d/+\\-−x×*:÷=])`,
  'g',
);
// Nhãn đầu bài: "Bài 1:", "Câu 2.", và số thứ tự đầu dòng "3)". Không bỏ "18: 2" vì đó là phép chia.
const labels = /(?<!\p{L})(?:bài|câu|phần|trang|tiết)\s*\d+\s*[:.)\-–]?|^\s*\d+[.)]\s+/giu;

function toNumber(text: string) {
  if (/^\d{1,3}(?:[ .]\d{3})+$/.test(text)) return Number(text.replace(/[ .]/g, ''));
  return Number(text.replace(',', '.'));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6))).replace('.', ',');
}

/** Tính biểu thức chỉ gồm số và + − × : (nhân chia trước, cộng trừ sau). Chia không hết trả về null. */
export function evaluate(expression: string): number | null {
  const tokens = expression.match(new RegExp(`${number}|${opPattern}`, 'g'));
  if (!tokens || tokens.length % 2 === 0) return null;
  const terms: number[] = [toNumber(tokens[0])];
  const signs: number[] = [1];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const value = toNumber(tokens[i + 1]);
    if (op === '+' || op === '-' || op === '−') {
      terms.push(value);
      signs.push(op === '+' ? 1 : -1);
    } else if (op === ':' || op === '÷') {
      if (value === 0) return null;
      terms[terms.length - 1] /= value;
    } else {
      terms[terms.length - 1] *= value;
    }
  }
  return terms.reduce((sum, term, i) => sum + signs[i] * term, 0);
}

/** Phép chia hai số nguyên không hết (lớp 3–4 viết "7 : 2 = 3 (dư 1)"): để AI chấm. */
function isDivisionWithRemainder(expression: string, value: number) {
  return /[:÷]/.test(expression) && !Number.isInteger(value) && !/\d[.,]\d{1,2}(?!\d)/.test(expression);
}

/** Các phép tính trên một dòng, kèm đáp án đúng do code tính. */
export function checkLine(line: string): CheckedCalculation[] {
  const text = line.replace(/[–—]/g, '-').replace(labels, ' ');
  const found: CheckedCalculation[] = [];
  for (const match of text.matchAll(equation)) {
    const [, expression, answer] = match;
    const value = evaluate(expression);
    if (value === null || isDivisionWithRemainder(expression, value)) continue;
    const correctAnswer = formatNumber(value);
    const clean = expression.replace(/\s+/g, ' ').trim();
    found.push({
      text: `${clean} = ${answer ?? ''}`.trim(),
      solved: `${clean} = ${correctAnswer}`,
      childAnswer: answer ?? null,
      correctAnswer,
      correct: answer === undefined ? null : Math.abs(toNumber(answer) - value) < 1e-9,
    });
  }
  if (found.length > 0) return found;
  for (const match of text.matchAll(comparison)) {
    const [, left, sign, right] = match;
    const a = toNumber(left);
    const b = toNumber(right);
    const correctAnswer = a > b ? '>' : a < b ? '<' : '=';
    found.push({
      text: `${left} ${sign} ${right}`,
      solved: `${left} ${correctAnswer} ${right}`,
      childAnswer: sign,
      correctAnswer,
      correct: sign === correctAnswer,
    });
  }
  return found;
}

/** Các phép tính trên cả trang (mỗi dòng chữ một phần tử). */
export function checkPage(lines: string[]): CheckedCalculation[] {
  return lines.flatMap(checkLine);
}

// Giữ lời nhờ chấm gọn, và chặn dữ liệu gửi lên quá lớn.
const maxKeyLines = 60;
const maxPageLines = 200;
const maxLineLength = 200;

/** Lấy các dòng của một trang từ dữ liệu app gửi lên; sai dạng thì coi như không có. */
export function safeLines(pageLines: unknown, page: number): string[] {
  const lines = Array.isArray(pageLines) ? pageLines[page] : undefined;
  if (!Array.isArray(lines)) return [];
  return lines
    .slice(0, maxPageLines)
    .filter((line): line is string => typeof line === 'string' && line.length <= maxLineLength);
}

/**
 * Đoạn gửi kèm cho AI: đáp án đúng do code tính. Chỉ gồm số và dấu tách từ regex nên chữ lạ trong
 * ảnh không lọt vào lời dặn. Máy có thể đọc nhầm đề, nên AI phải đối chiếu với ảnh trước khi dùng.
 */
export function answerKeyNote(calculations: CheckedCalculation[]) {
  const lines = [...new Set(calculations.map((calc) => `- ${calc.solved}`))].slice(0, maxKeyLines);
  if (lines.length === 0) return '';
  return `Máy đã đọc đề trên ảnh và tính sẵn các phép sau:
${lines.join('\n')}
Máy có thể đọc nhầm số. Phép nào khớp đúng với đề trên ảnh thì lấy kết quả đó làm correctAnswer, không tự tính lại. Phép nào không khớp thì bỏ qua và tự giải. Câu trả lời của bé vẫn phải đọc từ ảnh.`;
}
