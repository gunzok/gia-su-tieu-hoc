import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Cạnh dài nhất của ảnh gửi đi chấm: đủ rõ để đọc chữ viết tay, nhưng nhẹ để gửi nhanh
// và để LM Studio trên máy tính xử lý nhanh hơn.
const maxSide = 1600;

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
