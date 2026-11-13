// Nội dung Chính sách quyền riêng tư và Điều khoản cho BẢN WEB (GIA-71).
// Dựa trên chính sách trong app (src/app/chinh-sach-rieng-tu.tsx), thêm phần riêng của web.
// Chủ dự án đã duyệt nội dung ngày 12/11/2026 (GIA-74). Sửa nội dung thì cập nhật LEGAL_UPDATED_AT;
// cần đánh dấu lại là bản nháp thì đặt LEGAL_DRAFT = true.

export const LEGAL_DRAFT = false;
export const LEGAL_UPDATED_AT = '07/11/2026';
// Email hỗ trợ: đặt EXPO_PUBLIC_SUPPORT_EMAIL khi build (GIA-72). Chưa có thì ghi hướng dẫn chung.
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '';

export type LegalSection = { title: string; body: string[] };

const contactLine = SUPPORT_EMAIL
  ? `Ba mẹ có câu hỏi hoặc muốn xoá dữ liệu, vui lòng gửi email tới ${SUPPORT_EMAIL}.`
  : 'Ba mẹ có câu hỏi hoặc muốn xoá dữ liệu, vui lòng liên hệ qua email hỗ trợ do nhóm phát triển cung cấp khi mời dùng thử.';

export const privacyIntro =
  'Gia sư Tiểu học giúp bé làm bài tập về nhà. Chúng tôi chỉ dùng dữ liệu của bé để chấm bài và giúp ba mẹ theo dõi việc học. ' +
  'Bản web dành cho ba mẹ đăng ký và cho bé dùng dưới sự giám sát của ba mẹ.';

export const privacySections: LegalSection[] = [
  {
    title: 'Chúng tôi thu thập gì',
    body: [
      'Tài khoản của ba mẹ: email (và tên hiển thị nếu đăng nhập bằng Google).',
      'Hồ sơ của bé: tên thân mật (không bắt buộc), lớp, hình đại diện và gia sư bé chọn.',
      'Ảnh bài làm bé tải lên hoặc kéo thả vào trang web, và kết quả chấm (điểm, lời nhận xét).',
      'Câu bé gõ khi hỏi cô. Bản web không dùng micro.',
      'Số lượt chấm bài, hỏi cô và nghe giọng đọc trong ngày (để giới hạn mức dùng).',
      'Thông tin gói Plus (mua trong app điện thoại, do App Store / Google Play và RevenueCat xử lý; chúng tôi không thấy số thẻ).',
      'Trang web lưu phiên đăng nhập trong bộ nhớ của trình duyệt. Chúng tôi không dùng cookie quảng cáo.',
    ],
  },
  {
    title: 'Dùng để làm gì',
    body: [
      'Chấm bài và đọc lời nhận xét cho bé nghe.',
      'Lưu lịch sử bài làm để ba mẹ xem lại tiến độ, kể cả trên thiết bị khác.',
      'Giới hạn số lần dùng mỗi ngày và chống lạm dụng.',
      'Không có quảng cáo, không theo dõi bé để quảng cáo và không bán dữ liệu cho ai.',
    ],
  },
  {
    title: 'Chia sẻ với ai',
    body: [
      'Ảnh bài làm được gửi tới AI để chấm, chỉ cho việc chấm bài đó. Người dùng bản web hiện được chấm bằng Gemini (Google).',
      'Trong giai đoạn dùng thử, chúng tôi dùng gói miễn phí của Gemini: theo điều khoản của Google, nội dung gửi lên có thể được Google dùng để cải thiện sản phẩm. Ba mẹ nên che tên, địa chỉ hoặc ảnh người trên bài trước khi tải lên.',
      'Khi bé bấm "Hỏi cô", câu bé hỏi và nội dung câu đó trong bài được gửi tới AI để trả lời.',
      'Lời nhận xét (chỉ phần chữ, không có ảnh) được gửi tới dịch vụ giọng đọc (Google Cloud hoặc ElevenLabs) để đọc thành tiếng.',
      'Dữ liệu được lưu trên máy chủ Supabase, trong kho riêng: chỉ tài khoản của ba mẹ xem được.',
      'RevenueCat nhận mã tài khoản (không có tên bé) để xác nhận gói Plus.',
    ],
  },
  {
    title: 'Lưu bao lâu và cách xoá',
    body: [
      'Dữ liệu được giữ cho đến khi ba mẹ xoá.',
      'Ba mẹ có thể xoá lịch sử chấm bài, hoặc bấm "Xoá tài khoản & dữ liệu" ở mục Tiến độ để xoá vĩnh viễn hồ sơ bé, bài chấm, ảnh và tài khoản trên máy chủ.',
      'Gói Plus không tự huỷ khi xoá tài khoản: ba mẹ huỷ trong App Store / Google Play.',
    ],
  },
  {
    title: 'Quyền của ba mẹ và trẻ em',
    body: [
      'Bé dưới 16 tuổi chỉ dùng khi có sự đồng ý của ba mẹ (người giám hộ). Ba mẹ xác nhận đồng ý khi tạo hồ sơ cho bé.',
      'Ba mẹ có quyền xem, sửa, xoá dữ liệu của bé và rút lại sự đồng ý bất cứ lúc nào. Việc này được nêu theo tinh thần Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
    ],
  },
  {
    title: 'Liên hệ',
    body: [contactLine],
  },
];

export const termsIntro =
  'Khi tạo tài khoản và dùng Gia sư Tiểu học trên web, ba mẹ đồng ý với các điều khoản dưới đây.';

export const termsSections: LegalSection[] = [
  {
    title: 'Về dịch vụ',
    body: [
      'Gia sư Tiểu học giúp bé lớp 1–5 làm bài tập về nhà: AI chấm điểm, nhận xét và giảng lại từng câu.',
      'Bản web đang dùng thử với nhóm nhỏ nên có thể thay đổi, gián đoạn hoặc ngừng mà chúng tôi sẽ cố gắng báo trước.',
    ],
  },
  {
    title: 'Tài khoản',
    body: [
      'Tài khoản do ba mẹ (người từ đủ 18 tuổi) tạo và chịu trách nhiệm. Bé dùng dưới sự giám sát của ba mẹ.',
      'Ba mẹ giữ kín thông tin đăng nhập và cung cấp thông tin đúng. Mỗi tài khoản dùng cho một gia đình.',
    ],
  },
  {
    title: 'Kết quả của AI chỉ để tham khảo',
    body: [
      'AI có thể đọc nhầm chữ viết tay hoặc chấm sai. Kết quả chỉ để hỗ trợ học tập, không thay thế giáo viên. Ba mẹ nên xem lại các câu quan trọng.',
      'Chúng tôi không đảm bảo kết quả luôn chính xác và không chịu trách nhiệm cho quyết định học tập dựa hoàn toàn vào kết quả này.',
    ],
  },
  {
    title: 'Giới hạn sử dụng',
    body: [
      'Mỗi tài khoản có số lượt chấm bài, hỏi cô và nghe giọng đọc mỗi ngày. Tài khoản chưa có gói Plus dùng mức miễn phí.',
      'Không dùng dịch vụ để tải lên nội dung không phải bài tập, nội dung vi phạm pháp luật, ảnh người khác khi chưa được phép, hoặc cố ý làm quá tải, dò khoá, né giới hạn.',
      'Chúng tôi có thể tạm khoá tài khoản vi phạm hoặc gây hại cho hệ thống.',
    ],
  },
  {
    title: 'Gói Plus và thanh toán',
    body: [
      'Gói Plus hiện chỉ mua trong app điện thoại qua App Store / Google Play. Bản web chưa bán gói Plus.',
      'Việc huỷ gói, hoàn tiền thực hiện trong cửa hàng ứng dụng nơi ba mẹ đã mua.',
    ],
  },
  {
    title: 'Dữ liệu và quyền riêng tư',
    body: ['Việc thu thập và xử lý dữ liệu được nêu trong Chính sách quyền riêng tư.'],
  },
  {
    title: 'Thay đổi điều khoản và luật áp dụng',
    body: [
      'Chúng tôi có thể cập nhật điều khoản và sẽ thông báo trên trang web. Tiếp tục dùng sau khi cập nhật nghĩa là ba mẹ đồng ý bản mới.',
      'Điều khoản này theo pháp luật Việt Nam.',
    ],
  },
  {
    title: 'Liên hệ',
    body: [contactLine],
  },
];
