import type { ImagePickerAsset } from 'expo-image-picker';
import { useEffect, useEffectEvent, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  /** Gọi khi có ảnh được kéo thả vào khung. */
  onAssets: (assets: ImagePickerAsset[]) => void;
  style?: StyleProp<ViewStyle>;
  /** Kiểu thêm khi đang kéo ảnh phía trên khung. */
  overStyle?: StyleProp<ViewStyle>;
};

/** Đọc kích thước ảnh để đưa vào cùng dạng với ảnh chọn từ album. */
function toAsset(file: File): Promise<ImagePickerAsset> {
  const uri = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        uri,
        width: image.naturalWidth,
        height: image.naturalHeight,
        type: 'image',
        fileName: file.name,
        mimeType: file.type,
        // Cùng một tệp thả hai lần thì nhận ra là trang trùng.
        assetId: `${file.name}-${file.size}-${file.lastModified}`,
      });
    image.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    image.src = uri;
  });
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

// Khung nhận ảnh kéo từ máy tính thả vào (thiết kế Stitch: "Kéo ảnh bài tập vào đây").
export function DropZone({ children, onAssets, style, overStyle }: Props) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [over, setOver] = useState(false);
  const handleFiles = useEffectEvent(async (files: File[]) => {
    const assets = await Promise.all(files.map(toAsset)).catch((error) => {
      console.warn('Chưa đọc được ảnh kéo thả:', error);
      return [];
    });
    if (assets.length > 0) onAssets(assets);
  });

  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    // Đếm số lần vào/ra các phần tử con để khung không nhấp nháy.
    let depth = 0;
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setOver(true);
    };
    const hover = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setOver(false);
      const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith('image/'));
      if (files.length > 0) handleFiles(files);
    };
    node.addEventListener('dragenter', enter);
    node.addEventListener('dragover', hover);
    node.addEventListener('dragleave', leave);
    node.addEventListener('drop', drop);
    return () => {
      node.removeEventListener('dragenter', enter);
      node.removeEventListener('dragover', hover);
      node.removeEventListener('dragleave', leave);
      node.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <View ref={ref} style={[style, over && overStyle]}>
      {children}
    </View>
  );
}
