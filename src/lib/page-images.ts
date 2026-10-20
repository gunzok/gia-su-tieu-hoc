import { Directory, File, Paths } from 'expo-file-system';

import { currentUserId, supabase } from '@/lib/supabase';

// Ảnh các trang bài làm của mỗi lần chấm:
// - Trên máy: Documents/bai-lam/{mã bài chấm}/1.jpg, 2.jpg … (xem lại được cả khi mất mạng).
// - Trên Supabase: kho riêng tư "bai-lam", đường dẫn {id tài khoản}/{mã bài chấm}/1.jpg …
//   Chỉ đúng tài khoản đó đọc được (xem supabase/migrations/20261018150000_anh_bai_lam.sql).

const BUCKET = 'bai-lam';

function entryDirectory(entryId: string) {
  return new Directory(Paths.document, 'bai-lam', entryId);
}

/**
 * Đổi đường dẫn ảnh đã lưu sang thư mục Documents hiện tại của app.
 * iOS đổi mã thư mục app (…/Application/<mã>/Documents/) sau mỗi lần cài bản mới; file vẫn còn
 * nhưng đường dẫn cũ thì hỏng. Đường dẫn không nằm trong Documents thì giữ nguyên.
 */
export function rebaseDocumentUri(uri: string, documentUri: string) {
  const marker = '/Documents/';
  const index = uri.indexOf(marker);
  if (index === -1) return uri;
  const base = documentUri.endsWith('/') ? documentUri : `${documentUri}/`;
  return base + uri.slice(index + marker.length);
}

/** Ảnh các trang còn trên máy này (đã đổi sang thư mục hiện tại); trang nào mất file thì bỏ. */
export function existingLocalPages(pages: string[] | undefined) {
  if (!pages?.length) return undefined;
  const found = pages
    .map((uri) => rebaseDocumentUri(uri, Paths.document.uri))
    .filter((uri) => {
      try {
        return new File(uri).exists;
      } catch {
        return false;
      }
    });
  // Thiếu trang nào thì coi như không có ảnh trên máy, để màn xem bài lấy đủ ảnh từ kho.
  return found.length === pages.length ? found : undefined;
}

/** Chép ảnh đã thu nhỏ (file tạm) vào thư mục lâu dài của bài chấm; trả về uri trên máy. */
export async function savePagesLocally(entryId: string, tempUris: string[]) {
  const dir = entryDirectory(entryId);
  dir.create({ idempotent: true, intermediates: true });
  return Promise.all(
    tempUris.map(async (uri, index) => {
      const target = new File(dir, `${index + 1}.jpg`);
      await new File(uri).copy(target);
      return target.uri;
    }),
  );
}

export function deleteLocalPages(entryId: string) {
  const dir = entryDirectory(entryId);
  if (dir.exists) dir.delete();
}

/** Xoá mọi ảnh bài làm trên máy (khi xoá tài khoản). */
export function deleteAllLocalPages() {
  const dir = new Directory(Paths.document, 'bai-lam');
  if (dir.exists) dir.delete();
}

/** Tải ảnh trên máy lên kho Supabase; trả về đường dẫn trong kho, hoặc null nếu chưa tải được. */
export async function uploadPages(entryId: string, localUris: string[]) {
  const userId = await currentUserId();
  if (!supabase || !userId || localUris.length === 0) return null;
  const client = supabase;
  return Promise.all(
    localUris.map(async (uri, index) => {
      const path = `${userId}/${entryId}/${index + 1}.jpg`;
      const body = await new File(uri).arrayBuffer();
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
