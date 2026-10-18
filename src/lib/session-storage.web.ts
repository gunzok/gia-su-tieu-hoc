// Trình duyệt có sẵn localStorage, không cần expo-sqlite (bản web của nó cần thêm cấu hình WASM).
// Lúc dựng trang sẵn trên máy chủ (không có window) thì không lưu phiên.
export const sessionStorage = typeof window === 'undefined' ? undefined : window.localStorage;
