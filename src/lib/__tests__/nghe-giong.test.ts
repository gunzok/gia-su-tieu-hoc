import { micErrorMessage, withTranscript } from '@/lib/nghe-giong';

describe('withTranscript', () => {
  it('ô trống: chữ bé nói thành câu hỏi', () => {
    expect(withTranscript('', 'tại sao năm cộng ba bằng tám', 200)).toBe('tại sao năm cộng ba bằng tám');
  });

  it('ô đã có chữ: nối tiếp sau một khoảng trắng', () => {
    expect(withTranscript('Cô ơi,', 'vì sao con sai', 200)).toBe('Cô ơi, vì sao con sai');
    expect(withTranscript('Cô ơi ', 'vì sao', 200)).toBe('Cô ơi vì sao');
  });

  it('chữ nhận dần thay cho phần nghe trước, không lặp lại', () => {
    const base = 'Cô ơi';
    expect(withTranscript(base, 'vì', 200)).toBe('Cô ơi vì');
    expect(withTranscript(base, 'vì sao', 200)).toBe('Cô ơi vì sao');
  });

  it('chưa nghe được gì thì giữ nguyên ô nhập', () => {
    expect(withTranscript('Cô ơi', '', 200)).toBe('Cô ơi');
    expect(withTranscript('Cô ơi', '   ', 200)).toBe('Cô ơi');
  });

  it('bỏ khoảng trắng thừa ở hai đầu chữ nhận được', () => {
    expect(withTranscript('', '  con chưa hiểu  ', 200)).toBe('con chưa hiểu');
  });

  it('không vượt quá số ký tự cho phép', () => {
    expect(withTranscript('abc', 'defgh', 6)).toBe('abc de');
    expect(withTranscript('', 'x'.repeat(300), 200)).toHaveLength(200);
  });
});

describe('micErrorMessage', () => {
  it('chưa cho phép micro: nhắc nhẹ nhàng và chỉ cách gõ', () => {
    const message = micErrorMessage('not-allowed', 'cô');
    expect(message).toContain('micro');
    expect(message).toContain('gõ');
  });

  it('không nghe thấy gì: mời bé nói lại', () => {
    expect(micErrorMessage('no-speech', 'cô')).toContain('nói lại');
    expect(micErrorMessage('speech-timeout', 'thầy')).toContain('Thầy chưa nghe rõ');
  });

  it('bé tự dừng thì không báo gì', () => {
    expect(micErrorMessage('aborted', 'cô')).toBeNull();
  });

  it('lỗi mạng và lỗi khác vẫn có lời nhắn khích lệ, mời gõ', () => {
    expect(micErrorMessage('network', 'cô')).toContain('Internet');
    expect(micErrorMessage('audio-capture', 'cô')).toContain('gõ');
    expect(micErrorMessage('unknown', 'cô')).toContain('gõ');
  });
});
