import { Alert, Platform, type AlertButton } from 'react-native';

// react-native-web để trống Alert.alert nên mọi hộp thoại hỏi đáp (chụp lại ảnh, xoá lịch sử, hết lượt…)
// sẽ treo im lặng. Trên trình duyệt ta thay bằng hộp thoại của app (WebAlertHost), dùng chung code với điện thoại.

export type WebAlertState = { id: number; title: string; message?: string; buttons: AlertButton[] };

let queue: WebAlertState[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeWebAlert(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hộp thoại đang hiện (cái đến trước hiện trước). */
export function currentWebAlert(): WebAlertState | null {
  return queue[0] ?? null;
}

export function showWebAlert(title: string, message?: string, buttons?: AlertButton[]) {
  queue = [...queue, { id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: 'Đã hiểu' }] }];
  emit();
}

/** Đóng hộp thoại hiện tại rồi chạy việc của nút bấm. */
export function answerWebAlert(button?: AlertButton) {
  queue = queue.slice(1);
  emit();
  button?.onPress?.();
}

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => showWebAlert(title ?? '', message ?? undefined, buttons);
}
