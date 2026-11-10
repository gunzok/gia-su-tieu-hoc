import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { cameraErrorMessage, pagesLeft, WEBCAM_CONSTRAINTS } from '@/web/webcam';

type Props = {
  visible: boolean;
  /** Số trang tối đa mỗi lượt chấm, và số trang đã chọn trước đó. */
  maxPages: number;
  alreadyChosen: number;
  onClose: () => void;
  /** Gọi khi ba mẹ bấm "Xong" với các trang vừa chụp (theo thứ tự chụp). */
  onDone: (assets: ImagePickerAsset[]) => void;
};

/** Chụp một khung hình từ video ra ảnh JPEG cùng dạng với ảnh chọn từ máy. */
function grabFrame(video: HTMLVideoElement): Promise<ImagePickerAsset> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Không chụp được ảnh'));
        const stamp = Date.now();
        resolve({
          uri: URL.createObjectURL(blob),
          width,
          height,
          type: 'image',
          mimeType: 'image/jpeg',
          fileName: `chup-${stamp}.jpg`,
          fileSize: blob.size,
        });
      },
      'image/jpeg',
      0.92,
    );
  });
}

// Màn chụp bài bằng webcam máy tính hoặc camera điện thoại qua trình duyệt (GIA-62).
// Chụp liền nhiều trang, bấm "Xong" mới đưa vào bài; ảnh mờ/tối vẫn được kiểm như ảnh chọn từ máy.
export function WebcamCapture({ visible, maxPages, alreadyChosen, onClose, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shots, setShots] = useState<ImagePickerAsset[]>([]);
  const [flash, setFlash] = useState(false);
  const left = pagesLeft(maxPages, alreadyChosen, shots.length);
  // Chừa chỗ cho tiêu đề, lời dặn, dải ảnh và nút để màn thấp (laptop, điện thoại nằm ngang) vẫn thấy nút "Xong".
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Màn hẹp: hai nút xếp hai hàng và lời dặn dài hơn.
  const reserved = 310 + (shots.length > 0 ? 90 : 0) + (windowWidth < 520 ? 130 : 0);
  const stageHeight = Math.max(180, Math.min(480, windowHeight - reserved));

  useEffect(() => {
    if (!visible) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia(WEBCAM_CONSTRAINTS)
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().catch(() => {});
        }
      })
      .catch((e) => {
        if (!cancelled) setError(cameraErrorMessage(e));
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [visible]);

  function close(assets: ImagePickerAsset[]) {
    // Lần mở sau bắt đầu lại từ đầu.
    setShots([]);
    setError(null);
    setReady(false);
    if (assets.length > 0) onDone(assets);
    else onClose();
  }

  function cancel() {
    shots.forEach((s) => URL.revokeObjectURL(s.uri));
    close([]);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !ready || left <= 0) return;
    try {
      const shot = await grabFrame(video);
      setShots((current) => [...current, shot]);
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    } catch (e) {
      setError(cameraErrorMessage(e));
    }
  }

  function removeShot(index: number) {
    setShots((current) => {
      URL.revokeObjectURL(current[index].uri);
      return current.filter((_, i) => i !== index);
    });
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <AppText variant="headlineSm">Chụp bài bằng camera</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={cancel} hitSlop={8} style={styles.close}>
              <MaterialIcons name="close" size={24} color={Palette.ink} />
            </Pressable>
          </View>

          <View style={[styles.stage, { height: stageHeight }]}>
            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="videocam-off" size={40} color={Palette.coralDark} />
                <AppText variant="bodyMd" style={styles.center}>
                  {error}
                </AppText>
              </View>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => setReady(true)}
                  aria-label="Hình từ camera"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }}
                />
                {flash && <View style={styles.flash} />}
                {!ready && (
                  <View style={styles.loading}>
                    <AppText variant="labelMd" color={Palette.white}>
                      Đang mở camera… Ba mẹ bấm &quot;Cho phép&quot; nếu trình duyệt hỏi nhé.
                    </AppText>
                  </View>
                )}
              </>
            )}
          </View>

          <AppText variant="bodyMd" color={Palette.inkSoft}>
            Đặt cả trang vở trong khung, đủ sáng và giữ yên tay. Chụp xong từng trang rồi bấm &quot;Xong&quot;.
          </AppText>

          {shots.length > 0 && (
            <ScrollView horizontal style={styles.thumbStrip} contentContainerStyle={styles.thumbs}>
              {shots.map((shot, index) => (
                <View key={shot.uri} style={styles.thumb}>
                  <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ảnh vừa chụp số ${index + 1}`}
                    onPress={() => removeShot(index)}
                    hitSlop={8}
                    style={styles.thumbRemove}>
                    <MaterialIcons name="close" size={16} color={Palette.white} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <View style={styles.action}>
              <BigButton
                label={left > 0 ? `Chụp trang ${alreadyChosen + shots.length + 1}` : 'Đủ trang rồi'}
                icon="photo-camera"
                onPress={capture}
                disabled={!ready || !!error || left <= 0}
              />
            </View>
            <View style={styles.action}>
              <BigButton
                label={shots.length > 0 ? `Xong (${shots.length} trang)` : 'Huỷ'}
                icon={shots.length > 0 ? 'check' : undefined}
                variant="ghost"
                onPress={() => (shots.length > 0 ? close(shots) : cancel())}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  stage: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: { ...fill, backgroundColor: 'rgba(255,255,255,0.7)' },
  loading: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  errorBox: {
    ...fill,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  center: { textAlign: 'center' },
  thumbStrip: { flexGrow: 0, flexShrink: 0, height: 72 },
  thumbs: { gap: Spacing.two },
  thumb: { width: 72, height: 72, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Palette.surfaceMuted },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  action: { flexGrow: 1, flexBasis: 220 },
});
