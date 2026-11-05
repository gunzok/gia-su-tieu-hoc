// Đọc chữ trên ảnh bài làm ngay trên máy (GIA-53), không gửi đi đâu: Vision trên iOS, ML Kit trên
// Android. Máy chủ tách phép tính từ các dòng này và tự tính đáp án Toán (_shared/kiem-tinh.ts).
//
// Thư viện có mã native nên chỉ có từ bản build 0.5.0. Bản cài cũ nhận cập nhật OTA thì không có
// module này: kiểm tra trước, không import thẳng. Đọc không được thì AI chấm như bình thường.
import { requireOptionalNativeModule } from 'expo';

const readTimeoutMs = 5000;

/** Tách dòng và bỏ dòng trống (ML Kit trả về cả khối chữ nhiều dòng). */
export function toLines(blocks: string[]) {
  return blocks
    .flatMap((block) => block.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Các dòng chữ trên ảnh; rỗng nếu máy không đọc được. Không bao giờ làm chậm hay hỏng việc chấm bài. */
export async function readPageLines(uri: string): Promise<string[]> {
  if (!requireOptionalNativeModule('ExpoTextExtractor')) return [];
  try {
    const { extractTextFromImage } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('expo-text-extractor') as typeof import('expo-text-extractor');
    const timeout = new Promise<string[]>((resolve) => setTimeout(() => resolve([]), readTimeoutMs));
    return toLines(await Promise.race([extractTextFromImage(uri), timeout]));
  } catch (error) {
    console.warn('Chưa đọc được chữ trên ảnh:', error);
    return [];
  }
}
