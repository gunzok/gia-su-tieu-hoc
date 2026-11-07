// Hằng số bố cục của bản web, theo bộ thiết kế "Web App … Đa thiết bị & Màn hình gập" trong Stitch.
// Giao diện web nằm riêng trong src/web/ và các file route *.web.tsx; chức năng dùng chung với app ở src/lib/.

/** Từ độ rộng này: thanh bên có chữ (máy tính). */
export const WIDE_MIN_WIDTH = 1100;
/** Từ độ rộng này: hai khung (máy gập mở ra, tablet): thanh bên chỉ có biểu tượng. */
export const MEDIUM_MIN_WIDTH = 700;

export const SidebarWidth = 288;
export const RailWidth = 96;
export const TopBarHeight = 80;
export const ContentMaxWidth = 1240;
/** Bề ngang nội dung khi cửa sổ hẹp (điện thoại). */
export const NarrowContentWidth = 600;
/** Chừa chỗ cho thanh tab dưới khi cửa sổ hẹp. */
export const BottomBarInset = 84;
