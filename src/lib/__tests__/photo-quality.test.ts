import { measurePhoto, photoProblems, problemMessage, type Pixels } from '@/lib/photo-quality';

const W = 200;
const H = 150;

/** Trang giấy giả: nền sáng, có các nét chữ đen mảnh (giống chữ viết tay). */
function page(paper = 200): Pixels {
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ink = (y % 24 < 2 && x % 7 !== 0) || (x % 24 === 0 && y % 24 < 12);
      const v = ink ? 30 : paper;
      const i = (y * W + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: W, height: H };
}

function boxBlur({ data, width, height }: Pixels, r: number): Pixels {
  const out = new Uint8Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          const yy = Math.min(height - 1, Math.max(0, y + dy));
          sum += data[(yy * width + xx) * 4];
          n++;
        }
      }
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = sum / n;
      out[i + 3] = 255;
    }
  }
  return { data: out, width, height };
}

function scale(pixels: Pixels, k: number): Pixels {
  return { ...pixels, data: pixels.data.map((v, i) => (i % 4 === 3 ? v : v * k)) };
}

/** Thêm một đốm trắng xoá chiếm khoảng `fraction` diện tích ảnh. */
function withGlare(pixels: Pixels, fraction: number): Pixels {
  const data = new Uint8Array(pixels.data);
  const radius = Math.sqrt((fraction * W * H) / Math.PI);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x - W / 2) ** 2 + (y - H / 2) ** 2 < radius * radius) {
        const i = (y * W + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
      }
    }
  }
  return { ...pixels, data };
}

describe('photoProblems', () => {
  it('ảnh rõ, đủ sáng thì dùng được', () => {
    expect(photoProblems(measurePhoto(page()))).toEqual([]);
  });

  it('ảnh mờ nhẹ vẫn dùng được, mờ nặng thì báo mờ', () => {
    expect(photoProblems(measurePhoto(boxBlur(page(), 1)))).toEqual([]);
    expect(photoProblems(measurePhoto(boxBlur(page(), 5)))).toEqual(['blurry']);
  });

  it('ảnh tối thì báo tối (không báo thêm mờ)', () => {
    expect(photoProblems(measurePhoto(scale(page(), 0.3)))).toEqual(['dark']);
  });

  it('đốm lóa đèn lớn trên trang giấy thì báo lóa', () => {
    expect(photoProblems(measurePhoto(withGlare(page(), 0.2)))).toEqual(['glare']);
  });

  it('đốm lóa nhỏ thì bỏ qua', () => {
    expect(photoProblems(measurePhoto(withGlare(page(), 0.05)))).toEqual([]);
  });

  it('trang giấy trắng tinh dưới đèn sáng không bị coi là lóa', () => {
    expect(photoProblems(measurePhoto(page(255)))).toEqual([]);
  });
});

describe('problemMessage', () => {
  it('có lời nhắc tiếng Việt cho từng vấn đề', () => {
    expect(problemMessage('blurry')).toContain('mờ');
    expect(problemMessage('dark')).toContain('tối');
    expect(problemMessage('glare')).toContain('lóa');
  });
});
