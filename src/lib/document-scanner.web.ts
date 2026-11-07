// Trình duyệt không có trình quét trang native: luôn dùng hộp chọn ảnh thường.
export type ScannedPage = { uri: string; width: number; height: number };

export function canScanDocuments() {
  return false;
}

export async function scanPages(_maxPages: number): Promise<ScannedPage[] | null> {
  return null;
}
