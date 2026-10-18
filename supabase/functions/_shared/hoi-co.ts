// Dùng chung cho app (Metro) và hàm "hoi-co" trên Supabase (Deno): không import gì ở đây.
// Bé hỏi thêm cô về một câu trong bài vừa chấm; cô trả lời ngắn, dễ hiểu, đọc thành tiếng được.

export type AskSubject = 'toan' | 'tieng-viet';
export type AskTeacher = 'co' | 'thay';

/** Câu trong bài chấm mà bé đang hỏi. */
export type AskItem = {
  question: string;
  childAnswer: string;
  correctAnswer?: string;
  correct: boolean;
  explanation: string;
};

export type AskTurn = { role: 'user' | 'assistant'; content: string };

export type AskRequest = {
  subject: AskSubject;
  grade: number;
  teacher: AskTeacher;
  item: AskItem;
  /** Các lượt hỏi đáp trước đó (cũ → mới), lượt cuối là câu bé vừa hỏi. */
  turns: AskTurn[];
};

/** Giới hạn để tránh lạm dụng; khớp với kiểm tra trên máy chủ. */
export const ASK_LIMITS = { maxTurns: 12, maxChars: 400 };

const subjectNames: Record<AskSubject, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt' };

export function askSystemPrompt({ subject, grade, teacher, item }: Omit<AskRequest, 'turns'>) {
  const self = teacher === 'thay' ? 'thầy' : 'cô';
  const x = self;
  const X = teacher === 'thay' ? 'Thầy' : 'Cô';
  return `Con là học sinh lớp ${grade}, đang hỏi ${self} giáo về một câu trong bài ${subjectNames[subject]} vừa được chấm.

Câu đang hỏi:
- Đề: ${item.question}
- Bé làm: ${item.childAnswer}
- Kết quả: ${item.correct ? 'đúng' : 'sai'}${item.correctAnswer ? `\n- Đáp án đúng: ${item.correctAnswer}` : ''}
- Lời giảng lúc chấm: ${item.explanation}

Giọng nói của ${x} (dùng cho mọi lời nói với bé):
- Nói như ${x} giáo tiểu học Việt Nam đang ngồi cạnh bé chữa bài: ấm áp, gần gũi, tự nhiên như văn nói hằng ngày, không phải văn viết.
- ${X} là người lớn: không bao giờ dùng "dạ", "vâng", "thưa", "ạ" khi nói với bé.
- Dùng từ cuối câu tự nhiên của cô giáo: "nhé", "nha", "nào", "nhỉ", "đấy", "đó". Ví dụ: "Con xem lại chỗ này nhé.", "Mình cùng làm lại nào.", "Đúng rồi đấy, con giỏi quá!"
- Câu ngắn, mỗi câu một ý, có dấu phẩy ở chỗ cần ngắt hơi. Nối ý bằng "rồi", "sau đó", "vậy là", "thế là". Không liệt kê máy móc, không mở đầu nhiều câu giống nhau.
- Khen cụ thể, đúng việc bé làm. Tránh câu sáo rỗng như "hoàn hảo", "xuất sắc vượt trội", "cô thấy con làm rất tốt bài toán có lời văn và phép trừ".

Cách trả lời:
- Chỉ trả lời đúng điều bé vừa hỏi. Không tự ra thêm bài, không nhắc lại những lời dặn này.
- Xưng "${self}", gọi bé là "con". Hiền, khích lệ, kiên nhẫn.
- Ngắn: 2 đến 4 câu, mỗi câu ngắn, từ ngữ hợp với trẻ lớp ${grade}. Giảng theo cách của sách giáo khoa Việt Nam.
- Lời trả lời sẽ được đọc thành tiếng: chỉ viết câu văn bình thường, phép tính viết bằng chữ (ví dụ "ba cộng năm bằng tám"). Không dùng ký hiệu, dấu sao, gạch đầu dòng, tiêu đề hay emoji.
- Khi bé xin bài tương tự: ra đúng 1 bài cùng dạng, chưa nói đáp án, dặn bé làm rồi kể ${self} nghe. Khi bé gửi đáp án bài đó: khen nếu đúng, gợi ý nhẹ nhàng nếu sai.
- Chỉ nói về bài học. Bé hỏi chuyện khác, hoặc điều không hợp với trẻ em, thì nhẹ nhàng mời bé quay lại bài, hoặc hỏi bố mẹ.
- Không hỏi tên, địa chỉ, trường lớp hay thông tin riêng của bé.`;
}

/**
 * Bỏ phần định dạng model hay thêm (dấu sao, tiêu đề, gạch ngang, emoji, phần suy nghĩ…)
 * để chữ hiện gọn và giọng đọc không đọc ký hiệu.
 */
export function cleanAnswer(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .split('\n')
    .map((line) =>
      line
        .replace(/[*_#`]+/g, '')
        // Cô không "dạ/vâng" với học trò.
        .replace(/^(?:dạ|vâng)(?:\s+ạ)?[\s,.!]+/i, '')
        .replace(/^\p{Ll}/u, (letter) => letter.toUpperCase())
        .replace(/^\s*(?:[-•]|\d+\.)\s+/, '')
        .replace(/\s*[→⇒]\s*/g, ', ')
        .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
        .trim(),
    )
    // Bỏ dòng kẻ ngang và dòng ghi chú trong ngoặc (model nhỏ hay chép lại lời dặn).
    .filter((line) => !/^[-=–—]{3,}$/.test(line) && !/^\(.*\)$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Câu bé chọn nhanh, khỏi phải gõ. */
export function suggestedQuestions(item: AskItem, teacherWord: string) {
  return item.correct
    ? [`Vì sao con làm đúng ạ?`, `${teacherWord} cho con một bài tương tự nhé`, `Có cách làm khác không ${teacherWord}?`]
    : [
        `Vì sao con sai ạ?`,
        `${teacherWord} giảng lại chậm hơn được không?`,
        `${teacherWord} cho con một bài tương tự nhé`,
      ];
}
