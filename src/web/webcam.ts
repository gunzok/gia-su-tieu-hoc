// Logic chụp bằng webcam/camera qua trình duyệt (GIA-62). Tách khỏi giao diện để test được.

/** Trình duyệt có hỗ trợ mở camera không (cần HTTPS hoặc localhost). */
export function canUseWebcam(nav: Pick<Navigator, 'mediaDevices'> | undefined = globalThis.navigator): boolean {
  return typeof nav?.mediaDevices?.getUserMedia === 'function';
}

/**
 * Yêu cầu camera: ưu tiên camera sau (điện thoại, máy gập) để chụp vở; máy tính chỉ có webcam thì dùng webcam.
 * Xin độ phân giải cao để chữ bé viết rõ; trình duyệt tự hạ nếu camera không đạt.
 */
export const WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 2560 },
    height: { ideal: 1920 },
  },
};

/** Lời nhắc thân thiện cho ba mẹ khi không mở được camera. */
export function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error || (typeof error === 'object' && error !== null) ? (error as { name?: string }).name : undefined;
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Trình duyệt chưa cho dùng camera. Ba mẹ bấm biểu tượng ổ khoá cạnh thanh địa chỉ, cho phép Camera rồi thử lại nhé.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Máy này chưa có camera. Ba mẹ chụp bài bằng điện thoại rồi chọn ảnh từ máy nhé.';
    case 'NotReadableError':
    case 'AbortError':
      return 'Camera đang được ứng dụng khác dùng. Ba mẹ tắt ứng dụng đó (Zoom, Meet…) rồi thử lại nhé.';
    default:
      return 'Chưa mở được camera. Ba mẹ thử lại, hoặc chọn ảnh từ máy nhé.';
  }
}

/** Số trang còn chụp được trong lượt này. */
export function pagesLeft(maxPages: number, alreadyChosen: number, captured: number): number {
  return Math.max(0, maxPages - alreadyChosen - captured);
}
