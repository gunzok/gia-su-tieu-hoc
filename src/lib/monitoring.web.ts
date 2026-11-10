// Báo lỗi cho bản web bằng Sentry Loader Script (không thêm thư viện npm, không ảnh hưởng app điện thoại).
// Bật khi build có EXPO_PUBLIC_SENTRY_DSN. Không gửi dữ liệu cá nhân của bé: tắt PII, bỏ IP, không ghi màn hình.

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/** Lấy public key từ DSN dạng https://<key>@o123.ingest.sentry.io/456 */
export function sentryPublicKey(dsn: string): string | null {
  const m = /^https:\/\/([0-9a-f]+)@[^/]+\/\d+$/i.exec(dsn.trim());
  return m ? m[1] : null;
}

let started = false;

export function initMonitoring(): void {
  if (started || typeof document === 'undefined') return;
  const key = sentryPublicKey(SENTRY_DSN);
  if (!key) return;
  started = true;

  (window as unknown as { sentryOnLoad?: () => void }).sentryOnLoad = () => {
    const Sentry = (window as unknown as { Sentry?: { init: (o: object) => void } }).Sentry;
    Sentry?.init({
      dsn: SENTRY_DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend(event: { user?: unknown; request?: { url?: string } }) {
        delete event.user;
        // Bỏ query/hash khỏi URL (có thể chứa mã đăng nhập khi quay về từ Google).
        if (event.request?.url) event.request.url = event.request.url.split(/[?#]/)[0];
        return event;
      },
    });
  };

  const s = document.createElement('script');
  s.src = `https://js.sentry-cdn.com/${key}.min.js`;
  s.crossOrigin = 'anonymous';
  s.async = true;
  document.head.appendChild(s);
}
