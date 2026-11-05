// Dùng chung cho app (src/lib/grading.ts) và máy chủ Supabase (functions/cham-bai):
// kiểu dữ liệu, mẫu kết quả và lời dặn chấm bài. File này KHÔNG được import gì,
// để cả Metro (app) lẫn Deno (Supabase Edge Function) đều đọc được.

export type Subject = 'toan' | 'tieng-viet';

export const SubjectNames: Record<Subject, string> = {
  toan: 'Toán',
  'tieng-viet': 'Tiếng Việt',
};

/** Dạng bài, để AI biết cách đọc bài làm (nối thì lần đường nối, tô màu thì nhìn màu…). */
export type ItemKind = 'tinh' | 'dien' | 'khoanh' | 'noi' | 'to-mau' | 'bang' | 've-hinh' | 'viet' | 'khac';

export const itemKinds: ItemKind[] = ['tinh', 'dien', 'khoanh', 'noi', 'to-mau', 'bang', 've-hinh', 'viet', 'khac'];

export type GradedItem = {
  /** Dạng bài; bài chấm trước GSTH-038 không có trường này. */
  kind?: ItemKind;
  question: string;
  childAnswer: string;
  /** Đáp án đúng do AI tự giải; bài chấm trước khi có trường này thì không có. */
  correctAnswer?: string;
  correct: boolean;
  explanation: string;
};

export type GradingResult = {
  /** Ảnh có phải bài tập tiểu học không (bài chấm cũ không có trường này). */
  isHomework?: boolean;
  /** Lớp (1–5) mà kiến thức trong bài giống nhất; 0 nếu không xác định được. */
  detectedGrade?: number;
  /** Bài có hợp với lớp đang chấm không (ôn lại kiến thức lớp ngay dưới vẫn tính là hợp). */
  fitsGrade?: boolean;
  /** Các trang (từ 1) bé chụp trùng nên chỉ chấm một lần (GIA-50). */
  duplicatePages?: number[];
  score: number;
  spokenFeedback: string;
  items: GradedItem[];
  parentNote: string;
};

/**
 * "Kiến thức của cô giáo": đưa vào lời dặn mỗi lần chấm, dùng chung cho Claude và LM Studio.
 *
 * Nội dung tóm tắt theo tinh thần Thông tư 27/2020/TT-BGDĐT (đánh giá học sinh tiểu học)
 * và yêu cầu cần đạt của Chương trình GDPT 2018. Đây là bản tóm tắt tự soạn, không chép sách
 * giáo khoa. Nên nhờ giáo viên tiểu học đọc lại và sửa trực tiếp trong file này.
 */

const pedagogyPrinciples = `Nguyên tắc nhận xét (theo tinh thần Thông tư 27/2020 về đánh giá học sinh tiểu học):
- Đánh giá để giúp bé tiến bộ, không để so sánh hay chê. Không dùng từ "dốt", "kém", "sai bét", "lười".
- Khen cụ thể điều bé làm tốt trước (ví dụ: "con đặt tính thẳng hàng rất đẹp"), rồi mới chỉ lỗi.
- Mỗi lỗi phải kèm cách sửa cụ thể, từng bước nhỏ, dùng ví dụ gần gũi (que tính, quả táo, đồ chơi).
- Chỉ nói những lỗi thật sự có trong bài. Không đoán thêm lỗi, không bịa lý do.
- Giải thích bằng kiến thức bé đã học ở lớp mình, không dùng kiến thức hay thuật ngữ của lớp trên.
- Ghi nhận sự cố gắng, kể cả khi bài còn nhiều lỗi. Kết thúc bằng lời động viên ấm áp.
- Chữ viết, trình bày chỉ nhắc nhẹ nhàng khi ảnh hưởng tới việc đọc bài.`;

const gradeContent: Record<Subject, Record<number, string>> = {
  toan: {
    1: 'Số đến 100; so sánh số; cộng, trừ không nhớ trong phạm vi 100; nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật; đo độ dài bằng xăng-ti-mét; xem giờ đúng trên đồng hồ; các ngày trong tuần.',
    2: 'Số đến 1000; cộng, trừ có nhớ trong phạm vi 100 và trong phạm vi 1000; làm quen phép nhân, phép chia với bảng nhân 2, 5 và bảng chia 2, 5; đơn vị ki-lô-gam, lít, đề-xi-mét, mét, ki-lô-mét; xem giờ, phút; đường thẳng, đường gấp khúc, tứ giác; bài toán có lời văn một bước.',
    3: 'Số đến 100 000; bảng nhân, bảng chia từ 2 đến 9; nhân, chia số có nhiều chữ số với (cho) số có một chữ số; tính giá trị biểu thức; làm quen một phần mấy (1/2, 1/3, …); góc vuông, hình tròn (tâm, bán kính, đường kính); chu vi, diện tích hình chữ nhật, hình vuông; mi-li-mét, gam, mi-li-lít, nhiệt độ; tiền Việt Nam; bài toán giải bằng hai bước tính.',
    4: 'Số có nhiều chữ số, lớp triệu; cộng, trừ, nhân, chia số tự nhiên (nhân với số có hai chữ số, chia cho số có hai chữ số); phân số: rút gọn, quy đồng, so sánh, cộng, trừ, nhân, chia; trung bình cộng; tìm hai số khi biết tổng và hiệu; góc nhọn, góc tù, góc bẹt; hai đường thẳng vuông góc, song song; hình bình hành, hình thoi; yến, tạ, tấn, đề-xi-mét vuông, mét vuông, giây, thế kỉ; đọc biểu đồ cột.',
    5: 'Số thập phân và bốn phép tính với số thập phân; tỉ số, tỉ số phần trăm; tìm hai số khi biết tổng (hiệu) và tỉ số; chu vi, diện tích hình tam giác, hình thang, hình tròn; diện tích xung quanh, diện tích toàn phần, thể tích hình hộp chữ nhật, hình lập phương; xăng-ti-mét khối, đề-xi-mét khối, mét khối; vận tốc, quãng đường, thời gian trong chuyển động đều; tỉ lệ bản đồ; biểu đồ hình quạt tròn.',
  },
  'tieng-viet': {
    1: 'Âm, vần, ghép tiếng, đọc trơn câu ngắn; viết chữ thường đúng mẫu, đúng ô li; chính tả theo quy tắc c/k, g/gh, ng/ngh; nhìn tranh nói, viết câu ngắn.',
    2: 'Chính tả phân biệt l/n, s/x, tr/ch, r/d/gi, dấu hỏi/dấu ngã và các vần dễ lẫn; từ chỉ sự vật, hoạt động, đặc điểm; câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm; dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy; viết hoa chữ đầu câu và tên riêng; viết đoạn văn 4–5 câu.',
    3: 'Từ có nghĩa giống nhau, từ có nghĩa trái ngược; biện pháp so sánh; câu kể, câu hỏi, câu cảm, câu khiến; dấu hai chấm, dấu gạch ngang, dấu ngoặc kép; viết đoạn văn kể lại sự việc, tả đồ vật, nêu tình cảm, cảm xúc.',
    4: 'Danh từ, động từ, tính từ; chủ ngữ, vị ngữ, trạng ngữ; biện pháp nhân hoá; dấu gạch ngang, dấu ngoặc đơn; viết bài văn kể chuyện, miêu tả con vật, cây cối, đồ vật; viết đoạn văn nêu ý kiến.',
    5: 'Đại từ, kết từ; từ đồng nghĩa, từ đa nghĩa; câu đơn, câu ghép và cách nối các vế câu; liên kết câu trong đoạn; viết bài văn tả người, tả phong cảnh, kể chuyện sáng tạo, bài văn nêu ý kiến.',
  },
};

const commonMistakes: Record<Subject, string> = {
  toan: `Lỗi bé hay mắc và cách giảng:
- Quên cộng số nhớ / quên trừ số mượn: giảng lại từng hàng từ phải sang trái, "viết … nhớ …".
- Đặt tính không thẳng cột (hàng đơn vị, chục, trăm lệch nhau): nhắc viết các chữ số cùng hàng thẳng cột với nhau.
- Thuộc chưa chắc bảng nhân, bảng chia: gợi ý đọc lại bảng hoặc đếm thêm (3 × 4 là 3 + 3 + 3 + 3).
- Bài toán có lời văn: chọn sai phép tính, thiếu câu lời giải, thiếu hoặc sai đơn vị, thiếu đáp số. Hướng dẫn tìm "cho biết gì, hỏi gì".
- Nhầm đơn vị đo, đổi đơn vị sai (1 m = 10 dm = 100 cm).
- Xem đồng hồ: nhầm kim giờ với kim phút.
- Phân số (lớp 4–5): cộng cả tử với tử và mẫu với mẫu khi chưa quy đồng.
- Số thập phân (lớp 5): đặt dấu phẩy sai chỗ khi nhân, chia.`,
  'tieng-viet': `Lỗi bé hay mắc và cách giảng:
- Lẫn phụ âm đầu: l/n, s/x, tr/ch, r/d/gi; nêu một mẹo nhớ hoặc một từ quen thuộc để bé nhớ cách viết.
- Lẫn dấu hỏi/dấu ngã, thiếu dấu thanh: đọc chậm từng tiếng để bé nghe ra thanh điệu.
- Viết sai quy tắc c/k, g/gh, ng/ngh (k, gh, ngh đứng trước i, e, ê).
- Quên viết hoa chữ đầu câu, tên người, tên địa danh.
- Thiếu dấu chấm cuối câu, đặt dấu phẩy chưa đúng.
- Câu thiếu ý (thiếu "ai/cái gì" hoặc thiếu "làm gì/thế nào").
- Bài văn: lặp từ nhiều lần, ý sắp xếp lộn xộn; gợi ý dùng từ thay thế và sắp xếp theo thứ tự.`,
};

/** Phần kiến thức đưa vào lời dặn chấm bài, theo đúng lớp và môn bé đang làm. */
export function teacherKnowledge(subject: Subject, grade: number) {
  const content = gradeContent[subject][grade] ?? '';
  const previous = grade > 1 ? gradeContent[subject][grade - 1] : undefined;
  return [
    pedagogyPrinciples,
    `Nội dung trọng tâm lớp ${grade}: ${content}`,
    previous ? `Bé đã học ở lớp ${grade - 1}: ${previous}` : '',
    commonMistakes[subject],
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Cách đọc và chấm từng dạng bài (GSTH-038). Viết rõ từng bước để AI không bỏ sót bài tô màu, nối, bảng. */
export function exerciseGuide(teacher: TeacherVoice = 'co') {
  const x = teacher === 'thay' ? 'thầy' : 'cô';
  return `Cách chấm từng dạng bài (đọc kỹ trước khi chấm):
- Tính, điền số (tinh, dien): đọc từng phép tính, chép đúng số bé viết. Tự tính lại rồi so. Chữ số trẻ viết tay hay lẫn 1 và 7, 3 và 8, 4 và 9, 5 và 6, 0 và 6: nhìn kỹ nét chữ, KHÔNG tự sửa số bé viết cho khớp đáp án.
- Khoanh đáp án (khoanh): tìm chữ cái A, B, C, D có vòng tròn bao quanh, đó là lựa chọn của bé. Tự giải bài toán, tìm chữ cái đúng, rồi so: chỉ đúng khi chữ bé khoanh trùng chữ đúng.
- Nối (noi): lần theo từng đường bé vẽ, từ đầu này tới đầu kia, ghi "… nối với …". Tự tính kết quả của từng ô để biết ô nào phải nối với ô nào. Đường nào mờ hoặc chồng nhau không lần được thì dựa vào số bé ghi cạnh ô (nếu có) và nói rõ là ${x} nhìn chưa rõ đường nối.
- Tô màu (to-mau): bài tô màu KHÔNG có chữ, phải nhìn màu. Ghi bé đã tô hình nào và màu gì (hình nào để trắng thì là chưa tô). Tự tính phép tính trên từng hình, tìm hình phải tô theo đề (ví dụ hình có kết quả lớn nhất), rồi so với hình bé đã tô. Không chấm tô đẹp hay xấu, tô lem ra ngoài không trừ điểm.
- Hoàn thành bảng (bang): mỗi ô trống là một phép tính, đọc theo từng cột; ghi đủ từng ô bé điền.
- Vẽ hình (ve-hinh): xem hình bé vẽ có đúng yêu cầu không (đúng loại hình, đủ số cạnh, số ô, độ dài, vị trí). Không chấm nét vẽ đẹp hay xấu.
- Viết câu, chính tả (viet): đọc chữ viết tay theo ngữ cảnh để hiểu bé định viết gì, nhưng chỉ ra lỗi chính tả, viết hoa, dấu câu thật sự có. Chữ xấu không phải lỗi.

Liệt kê bài (bắt buộc):
- Đọc lần lượt từng trang, từ trên xuống dưới, cả "Tiết 1", "Tiết 2" nếu có. Mỗi bài được đánh số (1, 2, 3…) là MỘT mục trong items, không gộp hai bài, không bỏ bài nào.
- Bài tô màu, bài nối, bài vẽ hình không có chữ số bé viết vẫn phải có mục riêng.
- Bài có nhiều phần nhỏ (a, b, c… hoặc nhiều ô): ghi đủ các phần trong childAnswer và correctAnswer, mỗi phần một dòng. Bài chỉ đúng khi mọi phần đều đúng; sai phần nào thì explanation nói rõ phần đó.
- Bài bé chưa làm thì childAnswer ghi "chưa làm", correct là false, explanation nhắc bé làm nốt.

Tự kiểm tra trước khi trả lời:
- correct phải khớp với so sánh: childAnswer khác correctAnswer ở bất kỳ phần nào thì correct là false.
- explanation không được nói ngược với correct (correct true thì không nói bé sai; correct false thì chỉ đúng chỗ sai).`;
}

export const resultSchema = {
  type: 'object',
  additionalProperties: false,
  // Nhận biết bài (có phải bài tập, lớp mấy) trước; rồi chấm từng câu, sau cùng mới cho điểm và nhận xét.
  required: ['isHomework', 'detectedGrade', 'fitsGrade', 'items', 'score', 'spokenFeedback', 'parentNote'],
  properties: {
    isHomework: { type: 'boolean', description: 'true nếu ảnh là bài tập/bài làm của học sinh tiểu học' },
    detectedGrade: {
      type: 'integer',
      description: 'Lớp 1 đến 5 có kiến thức giống bài trong ảnh nhất; 0 nếu không phải bài tập hoặc không xác định',
    },
    fitsGrade: { type: 'boolean', description: 'true nếu bài hợp với lớp đang chấm' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // Thứ tự có chủ ý: AI tự giải ra correctAnswer trước rồi mới so với bài của bé.
        required: ['kind', 'question', 'childAnswer', 'correctAnswer', 'correct', 'explanation'],
        properties: {
          kind: {
            type: 'string',
            enum: itemKinds,
            description:
              'Dạng bài: tinh (tính, đặt tính), dien (điền số/chữ vào chỗ trống), khoanh (khoanh đáp án), noi (nối), to-mau (tô màu), bang (hoàn thành bảng), ve-hinh (vẽ hình), viet (viết câu, chính tả), khac',
          },
          question: { type: 'string' },
          childAnswer: { type: 'string', description: 'Đúng nguyên văn bé đã viết' },
          correctAnswer: {
            type: 'string',
            description: 'Đáp án đúng do cô tự giải lại, không nhìn bài của bé',
          },
          correct: { type: 'boolean', description: 'true khi childAnswer khớp correctAnswer' },
          explanation: { type: 'string' },
        },
      },
    },
    score: { type: 'number', description: 'Điểm trên thang 10, làm tròn 0.5' },
    spokenFeedback: {
      type: 'string',
      description: 'Lời nhận xét nói trực tiếp với bé, sẽ được đọc thành tiếng',
    },
    parentNote: {
      type: 'string',
      description: 'Ghi chú ngắn cho phụ huynh: lỗi bé hay mắc và gợi ý luyện thêm',
    },
  },
};

export type TeacherVoice = 'co' | 'thay';

export function systemPrompt(subject: Subject, grade: number, teacher: TeacherVoice = 'co') {
  const x = teacher === 'thay' ? 'thầy' : 'cô';
  const X = teacher === 'thay' ? 'Thầy' : 'Cô';
  return `Bạn là ${x} giáo tiểu học người Việt, hiền và kiên nhẫn, đang chấm bài tập về nhà môn ${SubjectNames[subject]} lớp ${grade} theo chương trình giáo dục phổ thông 2018 của Việt Nam.

${teacherKnowledge(subject, grade)}

Giọng nói của ${x} (dùng cho mọi lời nói với bé):
- Nói như ${x} giáo tiểu học Việt Nam đang ngồi cạnh bé chữa bài: ấm áp, gần gũi, tự nhiên như văn nói hằng ngày, không phải văn viết.
- ${X} là người lớn: không bao giờ dùng "dạ", "vâng", "thưa", "ạ" khi nói với bé.
- Dùng từ cuối câu tự nhiên của cô giáo: "nhé", "nha", "nào", "nhỉ", "đấy", "đó". Ví dụ: "Con xem lại chỗ này nhé.", "Mình cùng làm lại nào.", "Đúng rồi đấy, con giỏi quá!"
- Câu ngắn, mỗi câu một ý, có dấu phẩy ở chỗ cần ngắt hơi. Nối ý bằng "rồi", "sau đó", "vậy là", "thế là". Không liệt kê máy móc, không mở đầu nhiều câu giống nhau.
- Khen cụ thể, đúng việc bé làm. Tránh câu sáo rỗng như "hoàn hảo", "xuất sắc vượt trội", "cô thấy con làm rất tốt bài toán có lời văn và phép trừ".

Bước đầu tiên, nhận biết bài (làm trước khi chấm):
- isHomework: ảnh có phải bài tập, bài làm hay phiếu bài tập của học sinh tiểu học không.
- detectedGrade: TỰ xác định bài này thuộc kiến thức lớp mấy chỉ bằng cách nhìn nội dung trong ảnh, KHÔNG dựa vào lớp ${grade} mà phụ huynh khai báo (phụ huynh có thể khai sai). Gợi ý theo chương trình 2018:
  Toán lớp 1: số đến 100, cộng trừ không nhớ. Lớp 2: cộng trừ có nhớ trong phạm vi 100 và 1000, bảng nhân chia 2 và 5, m, dm, cm, kg, lít. Lớp 3: bảng nhân chia 2 đến 9, số đến 100 000, chu vi diện tích hình chữ nhật. Lớp 4: số lớp triệu, phân số, nhân chia số có hai chữ số. Lớp 5: số thập phân, tỉ số phần trăm, thể tích, vận tốc.
  Tiếng Việt lớp 1: âm, vần, ghép tiếng. Lớp 2: chính tả l/n, s/x, hỏi/ngã, từ chỉ sự vật hoạt động đặc điểm, câu Ai là gì, Ai làm gì. Lớp 3: so sánh, câu kể, câu hỏi, câu cảm. Lớp 4: danh từ, động từ, tính từ, chủ ngữ vị ngữ, nhân hoá. Lớp 5: đại từ, kết từ, từ đồng nghĩa, câu ghép.
  Không xác định được thì ghi 0.
- fitsGrade: true nếu detectedGrade bằng ${grade}${grade > 1 ? ` hoặc ${grade - 1} (ôn bài lớp dưới)` : ''}; ngược lại false.
Dù bài có hợp lớp hay không, vẫn chấm bình thường các bước bên dưới.

${exerciseGuide(teacher)}

Ảnh là bài làm của bé (có thể viết tay, chụp nghiêng hoặc mờ). Bài nhiều trang được chấm từng trang một; câu hỏi ghi kèm số trang (ví dụ "Trang 2 – Bài 3"). Hãy:
1. Đọc từng câu hỏi và câu trả lời của bé. Chỗ nào không đọc rõ thì ghi "không đọc rõ" thay vì đoán.
2. Với từng bài: ghi kind (dạng bài), chép nguyên văn câu trả lời của bé vào childAnswer, tự giải lại cẩn thận và ghi kết quả vào correctAnswer, rồi mới so hai kết quả để chấm đúng/sai. Với câu sai, explanation là lời ${x} nói với bé: chỉ ra bé sai ở bước nào và cách làm đúng, ngắn gọn, dễ hiểu với trẻ lớp ${grade}. Với câu đúng, explanation là một câu khen ngắn, cụ thể.
3. Cho điểm trên thang 10, làm tròn 0.5, tương ứng với số bài đúng.
4. Viết spokenFeedback để đọc thành tiếng cho bé nghe, theo đúng giọng nói ở trên: xưng "${x}", gọi bé là "con", 3–5 câu ngắn, khen điều bé làm tốt trước, chỉ ra tối đa 2 lỗi quan trọng nhất và cách sửa, kết thúc bằng một câu động viên. Lỗi nhắc tới phải đúng với các câu được chấm sai ở mục items, không thêm lỗi khác. Không dùng ký hiệu, emoji hay định dạng vì câu này sẽ được đọc lên; viết phép tính bằng chữ (ví dụ "bốn mươi bảy nhân ba").
5. Viết parentNote cho phụ huynh: lỗi bé mắc trong bài này (đúng như items) và gợi ý cách luyện thêm ở nhà phù hợp với lớp ${grade}.

Nếu ảnh không phải bài tập, trả về isHomework false, detectedGrade 0, score 0, items rỗng và nhẹ nhàng nhờ bé chụp lại bài làm.`;
}

// Chấm bài nhiều trang (GIA-49): mỗi trang một lần gọi AI, chạy song song, rồi code gộp lại.
// Gửi nhiều trang trong một lần thì AI hay chỉ chấm trang đầu và sót các trang sau.

/** Lời nhờ chấm gửi kèm ảnh; bài nhiều trang thì nói rõ đang chấm trang mấy. */
export function pageAsk(teacher: TeacherVoice, page: number, total: number) {
  const X = teacher === 'thay' ? 'Thầy' : 'Cô';
  if (total === 1) return `${X} chấm bài này giúp con nhé.`;
  return `Bài của con có ${total} trang, đây là trang ${page} trên ${total} trang. Chỉ chấm các bài trên trang này, ghi "Trang ${page} – " ở đầu mỗi câu hỏi. ${X} chấm giúp con nhé.`;
}

/** Thêm "Trang k – " vào câu hỏi nếu AI chưa ghi, để ba mẹ biết bài nằm ở trang nào. */
export function labelPageItems(result: GradingResult, page: number): GradingResult {
  return {
    ...result,
    items: result.items.map((item) =>
      /^trang\s*\d/i.test(item.question.trim()) ? item : { ...item, question: `Trang ${page} – ${item.question}` },
    ),
  };
}

/** Trang không có bài nào thường là AI bỏ sót: chấm lại trang đó một lần. */
export function needsRegrade(result: GradingResult) {
  return result.items.length === 0;
}

/** Điểm thang 10 theo số câu đúng, làm tròn 0,5 (giống normalizeResult trong app). */
function scoreFromItems(items: GradedItem[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.correct).length / items.length) * 20) / 2;
}

/** Lớp gặp nhiều nhất giữa các trang (bỏ 0); bằng nhau thì lấy lớp gặp trước. */
function mostCommonGrade(pages: GradingResult[]) {
  const counts = new Map<number, number>();
  for (const page of pages) {
    if (page.detectedGrade) counts.set(page.detectedGrade, (counts.get(page.detectedGrade) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = 0;
  for (const [grade, count] of counts) {
    if (count > bestCount) [best, bestCount] = [grade, count];
  }
  return best;
}

/**
 * Gộp kết quả các trang thành một bài. Trang không phải bài tập (trang bìa, ảnh nhầm) bị bỏ qua
 * nếu có trang khác là bài tập. Lời nhận xét ở đây chỉ là bản ghép tạm; máy chủ nhờ AI viết lại
 * lời nhận xét chung bằng summaryAsk.
 */
export function mergePages(pages: GradingResult[]): GradingResult {
  const homework = pages.filter((page) => page.isHomework !== false);
  if (homework.length === 0) return { ...pages[0], isHomework: false, score: 0, items: [] };
  const items = homework.flatMap((page) => page.items);
  const fits = homework.filter((page) => page.fitsGrade === true).length;
  const notFits = homework.filter((page) => page.fitsGrade === false).length;
  return {
    isHomework: true,
    detectedGrade: mostCommonGrade(homework),
    // Hoà thì coi là hợp lớp, tránh nhắc ba mẹ khi chưa chắc.
    fitsGrade: fits >= notFits,
    score: scoreFromItems(items),
    spokenFeedback: homework.map((page) => page.spokenFeedback.trim()).filter(Boolean).join(' '),
    items,
    parentNote: homework.map((page) => page.parentNote.trim()).filter(Boolean).join('\n'),
  };
}

/** Khoá so sánh một bài: đề + câu trả lời của bé, bỏ "Trang k –", dấu câu, khoảng trắng, chữ hoa. */
function itemKey(item: GradedItem) {
  const clean = (text: string) =>
    text
      .replace(/^\s*trang\s*\d+\s*[–-]\s*/i, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}+\-×x:=<>]/gu, '');
  return `${clean(item.question)}|${clean(item.childAnswer)}`;
}

/** Hai trang trùng khi ít nhất 80% bài (cả đề lẫn câu bé trả lời) giống nhau. */
const duplicateOverlap = 0.8;

/**
 * Số thứ tự (từ 1) các trang trùng với một trang đứng trước (GIA-50): bé chụp một trang hai lần.
 * So nội dung đã chấm chứ không so ảnh, vì các trang vở cùng mẫu trông rất giống nhau.
 */
export function duplicatePages(pages: GradingResult[]) {
  const keys = pages.map((page) => new Set(page.items.map(itemKey)));
  const duplicates: number[] = [];
  keys.forEach((current, index) => {
    if (current.size === 0) return;
    const same = keys.slice(0, index).some((earlier, earlierIndex) => {
      if (earlier.size === 0 || duplicates.includes(earlierIndex + 1)) return false;
      const shared = [...current].filter((key) => earlier.has(key)).length;
      return shared / Math.max(current.size, earlier.size) >= duplicateOverlap;
    });
    if (same) duplicates.push(index + 1);
  });
  return duplicates;
}

export type GradingSummary = Pick<GradingResult, 'spokenFeedback' | 'parentNote'>;

export const summarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['spokenFeedback', 'parentNote'],
  properties: {
    spokenFeedback: resultSchema.properties.spokenFeedback,
    parentNote: resultSchema.properties.parentNote,
  },
};

/** Nhờ AI viết lời nhận xét chung cho cả bài nhiều trang, dựa trên kết quả đã chấm (không gửi lại ảnh). */
export function summaryAsk(merged: GradingResult, teacher: TeacherVoice) {
  const x = teacher === 'thay' ? 'thầy' : 'cô';
  const items = merged.items.map(({ question, childAnswer, correctAnswer, correct, explanation }) => ({
    question,
    childAnswer,
    correctAnswer,
    correct,
    explanation,
  }));
  return `${x[0].toUpperCase()}${x.slice(1)} đã chấm xong từng trang của bài. Kết quả từng bài (${merged.items.filter((item) => item.correct).length}/${merged.items.length} bài đúng):
${JSON.stringify(items, null, 1)}

Không chấm lại. Dựa đúng vào kết quả trên, viết spokenFeedback và parentNote cho cả bài theo hướng dẫn ở mục 4 và 5.`;
}

// ---------- Dành cho LM Studio (AI trên máy tính ở nhà, dự phòng cuối trong app, GIA-54) ----------

/**
 * Hỏi riêng "bài này lớp mấy?" mà không cho biết lớp phụ huynh khai báo, để AI không bị lớp đó dẫn dắt.
 * Dùng khi chấm bằng AI nhỏ trên máy (LM Studio); AI trên máy chủ tự nhận biết ngay trong lần chấm.
 */
export const levelSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['isHomework', 'detectedGrade'],
  properties: {
    isHomework: { type: 'boolean' },
    detectedGrade: { type: 'integer' },
  },
};

export const levelPrompt = `Bạn là giáo viên tiểu học Việt Nam. Nhìn ảnh và cho biết:
- isHomework: ảnh có phải bài tập/bài làm của học sinh tiểu học không.
- detectedGrade: bài thuộc kiến thức lớp mấy (1 đến 5) theo chương trình 2018; không xác định hoặc không phải bài tập thì 0.
Gợi ý: Toán lớp 1 số đến 100, cộng trừ không nhớ. Lớp 2 cộng trừ có nhớ phạm vi 100 và 1000, bảng nhân chia 2 và 5, m dm cm kg lít, xem giờ. Lớp 3 bảng nhân chia 2 đến 9, số đến 100 000, chu vi diện tích hình chữ nhật. Lớp 4 số lớp triệu, phân số. Lớp 5 số thập phân, phần trăm, thể tích, vận tốc.
Tiếng Việt lớp 1 âm vần ghép tiếng. Lớp 2 chính tả l/n s/x hỏi/ngã, từ chỉ sự vật hoạt động đặc điểm, câu Ai là gì Ai làm gì, viết đoạn 4-5 câu. Lớp 3 so sánh, câu kể câu hỏi câu cảm. Lớp 4 danh từ động từ tính từ, chủ ngữ vị ngữ, nhân hoá. Lớp 5 đại từ, kết từ, từ đồng nghĩa, câu ghép.`;

/**
 * Chấm 2 bước cho AI nhỏ trên máy (LM Studio): làm một lần vừa đọc ảnh vừa giải toán thì AI 8B
 * hay bỏ sót bài và tính nhầm. Bước 1 chỉ nhìn ảnh và chép lại; bước 2 chấm từ bản chép (chỉ chữ).
 * Máy chủ (Gemini, Claude) vẫn chấm một lần như cũ (GIA-54).
 */
export type Transcript = {
  exercises: {
    page: number;
    number: string;
    kind: ItemKind;
    question: string;
    given: string;
    childWork: string;
  }[];
};

export const transcriptSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['exercises'],
  properties: {
    exercises: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['page', 'number', 'kind', 'question', 'given', 'childWork'],
        properties: {
          page: { type: 'integer', description: 'Trang thứ mấy (1, 2…)' },
          number: { type: 'string', description: 'Số bài, kèm tiết nếu có, ví dụ "Tiết 2 – Bài 1"' },
          kind: { type: 'string', enum: itemKinds },
          question: { type: 'string', description: 'Đề bài in trong sách, chép nguyên văn' },
          given: {
            type: 'string',
            description:
              'Mọi số, phép tính, chữ in sẵn trong bài (trên từng hình, từng ô, từng lựa chọn), mỗi thứ một dòng',
          },
          childWork: {
            type: 'string',
            description:
              'Bé đã làm gì, mỗi phần một dòng: số/chữ bé viết, chữ cái bé khoanh, đường bé nối, hình bé tô và màu gì; phần bỏ trống ghi "chưa làm"',
          },
        },
      },
    },
  },
};

export function transcribePrompt(subject: Subject, grade: number) {
  return `Bạn là giáo viên tiểu học Việt Nam. Ảnh là bài làm môn ${SubjectNames[subject]} lớp ${grade} của một bé, có thể gồm nhiều trang. Việc của bạn CHỈ là chép lại thật đầy đủ và chính xác, CHƯA chấm, CHƯA giải.

Cách chép:
- Đọc lần lượt từng trang, từ trên xuống dưới, cả "Tiết 1", "Tiết 2". Mỗi bài có số thứ tự (1, 2, 3…) là một mục. Không bỏ bài nào, kể cả bài tô màu, bài nối, bài vẽ hình, bảng.
- given: chép mọi số và phép tính in sẵn. Bài có hình (ngôi nhà, quả táo, con diều, ô vuông…) thì ghi từng hình một dòng, ví dụ "Ngôi nhà 1: 12 – 9". Bảng thì ghi từng cột. Bài khoanh thì ghi từng lựa chọn A, B, C, D.
- childWork: chỉ ghi điều bé đã làm, mỗi phần một dòng, đúng thứ tự với given:
  · Số, chữ bé viết tay: chép đúng nét bé viết, KHÔNG sửa cho đúng. Chữ số viết tay hay lẫn 1/7, 3/8, 4/9, 5/6, 0/6: nhìn kỹ.
  · Tô màu: hình nào được tô và màu gì (đỏ, xanh lá, xanh dương, vàng, hồng…); hình để trắng ghi "không tô".
  · Nối: lần theo từng đường, ghi "… nối với …".
  · Khoanh: chữ cái nào có vòng tròn bao quanh.
  · Vẽ hình: mô tả hình bé vẽ (loại hình, số cạnh, số ô).
  · Chỗ không nhìn rõ ghi "không nhìn rõ".`;
}

/** Lời nhắn bước 2: đưa bản chép cho AI chấm (không gửi lại ảnh). */
export function gradeFromTranscript(transcript: Transcript) {
  const lines = transcript.exercises.map(
    (e, i) =>
      `Bài ${i + 1} (trang ${e.page}, ${e.number}, dạng ${e.kind})\nĐề: ${e.question}\nIn sẵn:\n${e.given}\nBé làm:\n${e.childWork}`,
  );
  return `Đây là bản chép đầy đủ bài làm của bé (đã chép từ ảnh, chép đúng nguyên văn những gì bé làm). Hãy chấm ĐÚNG ${transcript.exercises.length} bài này, mỗi bài một mục trong items, theo thứ tự. Với từng bài: tự giải từng phần từ phần "In sẵn" rồi so với phần "Bé làm".

${lines.join('\n\n')}`;
}
