import { sentryPublicKey } from '../monitoring.web';

describe('sentryPublicKey', () => {
  it('lấy key từ DSN hợp lệ', () => {
    expect(sentryPublicKey('https://abc123def@o42.ingest.us.sentry.io/789')).toBe('abc123def');
  });
  it('trả null khi DSN trống hoặc sai dạng', () => {
    expect(sentryPublicKey('')).toBeNull();
    expect(sentryPublicKey('http://abc@x.io/1')).toBeNull();
    expect(sentryPublicKey('https://x.io/1')).toBeNull();
  });
});
