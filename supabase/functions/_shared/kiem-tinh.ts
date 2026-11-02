// Code tự tính đáp án Toán (GIA-53): tìm các phép tính trên một dòng chữ đọc được từ ảnh
// (ví dụ "d) 16 - 9 = 8", "b) 67 > 76") rồi tính lại bằng code, không nhờ AI tính.
// Dùng chung cho app và máy chủ nên không import gì.

export type CheckedCalculation = {
  /** Phép tính như trên trang, đã chuẩn hoá dấu (ví dụ "16 - 9 = 8"). */
  text: string;
  /** Phép tính viết sẵn đáp án đúng (ví dụ "16 - 9 = 7", "67 < 76"). */
  solved: string;
  /** Số hoặc dấu bé viết sau dấu bằng / giữa hai số. */
  childAnswer: string;
  /** Đáp án đúng do code tính. */
  correctAnswer: string;
  correct: boolean;
};

const opPattern = '[+\\-−x×*:÷]';
const number = '\\d+(?:[.,]\\d+)?';
// "a op b (op c …) = kết quả", có thể kèm đơn vị trong ngoặc phía sau.
const equation = new RegExp(`(${number}(?:\\s*${opPattern}\\s*${number})+)\\s*=\\s*(${number})`, 'g');
// "a > b", "a < b", "a = b" (bài điền dấu): hai số đứng riêng, không thuộc phép tính dài hơn.
const comparison = new RegExp(`(?<![\\d+\\-−x×*:÷=]\\s*)(${number})\\s*([<>=])\\s*(${number})(?!\\s*[\\d+\\-−x×*:÷=])`, 'g');

function toNumber(text: string) {
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

/** Các phép tính trên một dòng, kèm đáp án đúng do code tính. */
export function checkLine(line: string): CheckedCalculation[] {
  // Chữ đọc từ ảnh hay dính: "2 x7 =16", "35:5 = 7".
  const text = line.replace(/[–—]/g, '-');
  const found: CheckedCalculation[] = [];
  for (const match of text.matchAll(equation)) {
    const [, expression, answer] = match;
    const value = evaluate(expression);
    if (value === null) continue;
    const correctAnswer = formatNumber(value);
    const clean = expression.replace(/\s+/g, ' ').trim();
    found.push({
      text: `${clean} = ${answer}`,
      solved: `${clean} = ${correctAnswer}`,
      childAnswer: answer,
      correctAnswer,
      correct: Math.abs(toNumber(answer) - value) < 1e-9,
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

/** Đoạn gửi kèm cho AI: đáp án đúng do code tính, để AI chỉ cần đọc số bé viết rồi so. */
export function answerKeyNote(calculations: CheckedCalculation[]) {
  if (calculations.length === 0) return '';
  const lines = calculations.map((calc) => `- ${calc.solved}`);
  return `Đáp án đúng của các phép tính trên trang, do máy tính sẵn (tin vào đây, không tự tính lại):\n${lines.join('\n')}`;
}
