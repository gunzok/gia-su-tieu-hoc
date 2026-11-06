// Hằng số bố cục của bản web, theo thiết kế "Web App" trong Stitch (dự án "AI Gia Sư Tiểu Học").
// Giao diện web nằm riêng trong src/web/ và các file route *.web.tsx; chức năng dùng chung với app ở src/lib/.

/** Từ độ rộng này trở lên dùng thanh bên trái; hẹp hơn dùng thanh tab dưới. */
export const DESKTOP_MIN_WIDTH = 1024;
export const SidebarWidth = 288;
export const TopBarHeight = 80;
export const DesktopContentWidth = 1240;
/** Bề ngang nội dung khi cửa sổ hẹp (giống điện thoại). */
export const NarrowContentWidth = 600;
/** Chừa chỗ cho thanh tab dưới khi cửa sổ hẹp. */
export const BottomBarInset = 84;
