// Quét trang vở như máy scan (GIA-47): trình quét có sẵn của máy (VisionKit trên iOS, ML Kit trên
// Android) tự tìm mép giấy, cắt phần thừa và làm thẳng trang. Ảnh vẫn giữ màu.
//
// Thư viện có mã native nên chỉ có từ bản build 0.5.0. Bản cài cũ nhận cập nhật OTA thì không có
// module này: kiểm tra trước và lùi về camera thường, không import thẳng (import sẽ làm app lỗi).
import { ImageManipulator } from 'expo-image-manipulator';
import { TurboModuleRegistry } from 'react-native';

export type ScannedPage = { uri: string; width: number; height: number };

export function canScanDocuments() {
  return TurboModuleRegistry.get('DocumentScanner') != null;
}

/**
 * Mở trình quét. Trả về các trang đã quét (theo thứ tự), mảng rỗng nếu bé đóng trình quét,
 * hoặc null nếu máy không quét được (máy giả lập, bản cài cũ…) để dùng camera thường.
 */
export async function scanPages(maxPages: number): Promise<ScannedPage[] | null> {
  if (!canScanDocuments()) return null;
  const { default: DocumentScanner, ResponseType, ScanDocumentResponseStatus } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-document-scanner-plugin') as typeof import('react-native-document-scanner-plugin');
  let response;
  try {
    response = await DocumentScanner.scanDocument({
      croppedImageQuality: 90,
      maxNumDocuments: maxPages,
      responseType: ResponseType.ImageFilePath,
    });
  } catch (error) {
    console.warn('Không mở được trình quét trang, dùng camera thường:', error);
    return null;
  }
  if (response.status !== ScanDocumentResponseStatus.Success) return [];
  const uris = (response.scannedImages ?? []).slice(0, maxPages);
  return Promise.all(
    uris.map(async (raw) => {
      const uri = raw.startsWith('file://') ? raw : `file://${raw}`;
      const image = await ImageManipulator.manipulate(uri).renderAsync();
      return { uri, width: image.width, height: image.height };
    }),
  );
}
