import type { Subject } from '@/lib/grading';

/**
 * "Kiến thức của cô giáo": đưa vào lời dặn mỗi lần chấm, dùng chung cho Claude và LM Studio.
 *
 * Nội dung tóm tắt theo tinh thần Thông tư 27/2020/TT-BGDĐT (đánh giá học sinh tiểu học)
 * và yêu cầu cần đạt của Chương trình GDPT 2018. Đây là bản tóm tắt tự soạn, không chép sách
 * giáo khoa. Nên nhờ giáo viên tiểu học đọc lại và sửa trực tiếp trong file này.
 */

export const pedagogyPrinciples = `Nguyên tắc nhận xét (theo tinh thần Thông tư 27/2020 về đánh giá học sinh tiểu học):
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
