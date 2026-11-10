import { cameraErrorMessage, canUseWebcam, pagesLeft } from '../webcam';

function domError(name: string) {
  const error = new Error('x');
  error.name = name;
  return error;
}

describe('canUseWebcam', () => {
  it('có getUserMedia thì dùng được', () => {
    expect(canUseWebcam({ mediaDevices: { getUserMedia: jest.fn() } } as never)).toBe(true);
  });
  it('trang không bảo mật (không có mediaDevices) thì không dùng được', () => {
    expect(canUseWebcam({} as never)).toBe(false);
    expect(canUseWebcam(undefined)).toBe(false);
  });
});

describe('cameraErrorMessage', () => {
  it('bị từ chối quyền thì hướng dẫn cho phép camera', () => {
    expect(cameraErrorMessage(domError('NotAllowedError'))).toContain('cho phép Camera');
  });
  it('không có camera thì gợi ý chọn ảnh', () => {
    expect(cameraErrorMessage(domError('NotFoundError'))).toContain('chưa có camera');
  });
  it('camera bận', () => {
    expect(cameraErrorMessage(domError('NotReadableError'))).toContain('ứng dụng khác');
  });
  it('lỗi lạ vẫn có lời nhắc', () => {
    expect(cameraErrorMessage('?')).toContain('Chưa mở được camera');
  });
});

describe('pagesLeft', () => {
  it('trừ trang đã chọn và đã chụp, không âm', () => {
    expect(pagesLeft(5, 1, 2)).toBe(2);
    expect(pagesLeft(5, 4, 3)).toBe(0);
  });
});
