import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

import { CHECK_SIZE, measurePhoto, photoProblems } from '@/lib/photo-quality';

// Cạnh dài nhất của ảnh gửi đi chấm (GIA-52): 2200 thay vì 1600 để chữ số viết tay to gấp ~1,4 lần.
// Claude Opus 5.5 đọc ảnh tới 2576 điểm ảnh / 4784 token mỗi ảnh; trang A4 ở 2200 khoảng 4600 token
// (1600 khoảng 2500), base64 khoảng 700 KB (1600 khoảng 440 KB), vẫn dưới giới hạn 6 MB của máy chủ.
// Giữ ảnh màu, không chuyển đen trắng (hỏng bài tô màu).
const maxSide = 2200;

/** Thu nhỏ và nén ảnh bài làm: trả về file JPEG tạm (uri) và nội dung base64 để gửi chấm. */
export async function preparePhotoForGrading(photo: { uri: string; width: number; height: number }) {
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > maxSide) {
    context.resize(photo.width >= photo.height ? { width: maxSide } : { height: maxSide });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!result.base64) throw new Error('Không đọc được ảnh bài làm. Con thử chụp lại nhé.');
  return { uri: result.uri, base64: result.base64 };
}

/** Đo ảnh vừa chụp/chọn (GIA-48). Đo trên bản thu nhỏ cố định CHECK_SIZE để ngưỡng độ nét đúng. */
export async function checkPhotoQuality(photo: { uri: string; width: number; height: number }) {
  const context = ImageManipulator.manipulate(photo.uri);
  context.resize(photo.width >= photo.height ? { width: CHECK_SIZE } : { height: CHECK_SIZE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
  if (!result.base64) return [];
  const bytes = Uint8Array.from(atob(result.base64), (char) => char.charCodeAt(0));
  const pixels = decode(bytes, { useTArray: true, formatAsRGBA: true });
  return photoProblems(measurePhoto(pixels));
}
