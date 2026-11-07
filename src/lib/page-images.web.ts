import { currentUserId, supabase } from '@/lib/supabase';

// Bản trình duyệt của page-images.ts. Trình duyệt không có thư mục Documents như điện thoại:
// - Ảnh các trang chỉ xem lại được trong lần mở trang này (link blob: của ảnh vừa thu nhỏ).
// - Sau khi tải lại trang, ảnh lấy từ kho Supabase "bai-lam" (cần bài đã được tải lên, tức là đã đăng nhập
//   hoặc có phiên ẩn danh), giống bản điện thoại khi mất file trên máy.

const BUCKET = 'bai-lam';

// Các link blob: tạo trong lần mở trang này; link của lần trước đã chết nên không dùng.
const liveUrls = new Set<string>();

/** Bản điện thoại đổi đường dẫn Documents sau khi cài lại app; trình duyệt không có chuyện đó. */
export function rebaseDocumentUri(uri: string, documentUri: string) {
  const marker = '/Documents/';
  const index = uri.indexOf(marker);
  if (index === -1) return uri;
  const base = documentUri.endsWith('/') ? documentUri : `${documentUri}/`;
  return base + uri.slice(index + marker.length);
}

/** Ảnh các trang còn xem được; thiếu trang nào thì coi như không có ảnh để màn xem bài lấy từ kho. */
export function existingLocalPages(pages: string[] | undefined) {
  if (!pages?.length) return undefined;
  return pages.every((uri) => liveUrls.has(uri)) ? pages : undefined;
}

/** Giữ link ảnh đã thu nhỏ cho lần mở trang này; trả về chính các link đó. */
export async function savePagesLocally(_entryId: string, tempUris: string[]) {
  for (const uri of tempUris) liveUrls.add(uri);
  return tempUris;
}

export function deleteLocalPages(_entryId: string) {}

export function deleteAllLocalPages() {
  liveUrls.clear();
}

/** Tải ảnh lên kho Supabase; trả về đường dẫn trong kho, hoặc null nếu chưa tải được. */
export async function uploadPages(entryId: string, localUris: string[]) {
  const userId = await currentUserId();
  if (!supabase || !userId || localUris.length === 0) return null;
  const client = supabase;
  return Promise.all(
    localUris.map(async (uri, index) => {
      const path = `${userId}/${entryId}/${index + 1}.jpg`;
      const body = await (await fetch(uri)).arrayBuffer();
      const { error } = await client.storage.from(BUCKET).upload(path, body, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;
      return path;
    }),
  );
}

/** Đường link xem ảnh trong kho (hết hạn sau 1 giờ). */
export async function signedPageUrls(paths: string[]) {
  if (!supabase || paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return data.map((item) => item.signedUrl).filter((url): url is string => !!url);
}

export async function deleteRemotePages(paths: string[]) {
  if (!supabase || paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
