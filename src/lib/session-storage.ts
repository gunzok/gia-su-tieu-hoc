import 'expo-sqlite/localStorage/install';

// Nơi Supabase lưu phiên đăng nhập trên điện thoại: localStorage do expo-sqlite cung cấp
// (theo hướng dẫn Supabase của Expo). Bản web dùng localStorage của trình duyệt.
export const sessionStorage = globalThis.localStorage;
