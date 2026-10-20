import { rebaseDocumentUri } from '@/lib/page-images';

// jest.mock được đưa lên trước import khi chạy test.
jest.mock('expo-file-system', () => ({ Directory: jest.fn(), File: jest.fn(), Paths: {} }));
jest.mock('@/lib/supabase', () => ({ supabase: null, currentUserId: jest.fn() }));

const now = 'file:///Users/me/Library/Developer/CoreSimulator/Devices/X/data/Containers/Data/Application/NEW-ID/Documents/';

describe('rebaseDocumentUri', () => {
  it('đổi ảnh của bản cài cũ sang thư mục Documents hiện tại', () => {
    const old =
      'file:///Users/me/Library/Developer/CoreSimulator/Devices/X/data/Containers/Data/Application/OLD-ID/Documents/bai-lam/1792/1.jpg';
    expect(rebaseDocumentUri(old, now)).toBe(`${now}bai-lam/1792/1.jpg`);
  });

  it('đường dẫn đã đúng thì giữ nguyên', () => {
    expect(rebaseDocumentUri(`${now}bai-lam/1/2.jpg`, now)).toBe(`${now}bai-lam/1/2.jpg`);
  });

  it('thư mục Documents không có dấu / ở cuối vẫn ghép đúng', () => {
    expect(rebaseDocumentUri('file:///a/OLD/Documents/bai-lam/9/1.jpg', 'file:///b/NEW/Documents')).toBe(
      'file:///b/NEW/Documents/bai-lam/9/1.jpg',
    );
  });

  it('ảnh không nằm trong Documents (Android content://, link web) thì giữ nguyên', () => {
    expect(rebaseDocumentUri('content://media/1', now)).toBe('content://media/1');
    expect(rebaseDocumentUri('https://x.supabase.co/a.jpg', now)).toBe('https://x.supabase.co/a.jpg');
  });
});
