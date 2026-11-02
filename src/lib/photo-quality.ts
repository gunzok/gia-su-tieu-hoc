// Đo chất lượng ảnh bài làm trước khi gửi chấm (GIA-48): mờ, tối, lóa đèn.
// Chỉ tính toán trên điểm ảnh, không import gì của Expo để chạy được trong test.
// Ngưỡng chỉnh theo bộ ảnh mẫu (mau-bai-tap/) cùng các bản làm mờ, làm tối, làm lóa của chúng.

/** Ảnh đã giải nén: RGBA, mỗi điểm 4 byte (giống ImageData / jpeg-js). */
export type Pixels = { data: Uint8Array | Uint8ClampedArray; width: number; height: number };

export type PhotoMetrics = {
  /** Độ nét: phương sai của bộ lọc Laplacian trên ảnh xám. Càng nhỏ càng mờ. */
  sharpness: number;
  /** Độ sáng trung bình, 0 (đen) đến 255 (trắng). */
  brightness: number;
  /** Tỉ lệ điểm ảnh cháy trắng (lóa đèn), 0 đến 1. */
  glare: number;
  /** Độ sáng trung vị (thường là màu giấy). */
  median: number;
};

export type PhotoProblem = 'blurry' | 'dark' | 'glare';

/** Cạnh dài của ảnh dùng để đo; ảnh đo phải cùng cỡ thì ngưỡng độ nét mới đúng. */
export const CHECK_SIZE = 800;

export const thresholds = {
  minSharpness: 60,
  minBrightness: 70,
  maxGlare: 0.12,
  // Giấy chụp dưới đèn sáng có thể trắng gần hết mà vẫn đọc được: chỉ coi là lóa khi
  // phần lớn trang giấy còn chưa cháy trắng, tức vùng trắng xoá là một đốm đèn.
  maxGlarePaperMedian: 235,
};

export function measurePhoto({ data, width, height }: Pixels): PhotoMetrics {
  const gray = new Float32Array(width * height);
  const histogram = new Uint32Array(256);
  let sum = 0;
  let burnt = 0;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = y;
    histogram[Math.min(255, Math.round(y))]++;
    sum += y;
    if (r >= 250 && g >= 250 && b >= 250) burnt++;
  }

  // Laplacian 4 hướng, bỏ viền 1 điểm ảnh.
  let lapSum = 0;
  let lapSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      lapSum += lap;
      lapSquares += lap * lap;
      count++;
    }
  }
  const lapMean = count ? lapSum / count : 0;
  let median = 0;
  for (let seen = 0; median < 255; median++) {
    seen += histogram[median];
    if (seen * 2 >= width * height) break;
  }
  return {
    sharpness: count ? lapSquares / count - lapMean * lapMean : 0,
    brightness: sum / (width * height),
    glare: burnt / (width * height),
    median,
  };
}

/** Các vấn đề của ảnh, xếp theo mức nên báo trước. Rỗng là ảnh dùng được. */
export function photoProblems(metrics: PhotoMetrics): PhotoProblem[] {
  const problems: PhotoProblem[] = [];
  if (metrics.brightness < thresholds.minBrightness) problems.push('dark');
  if (metrics.glare > thresholds.maxGlare && metrics.median < thresholds.maxGlarePaperMedian) problems.push('glare');
  // Ảnh quá tối thì độ nét cũng thấp; chỉ báo mờ khi ảnh đủ sáng.
  if (!problems.includes('dark') && metrics.sharpness < thresholds.minSharpness) problems.push('blurry');
  return problems;
}

/** Lời nhắc cho bé, bằng giọng thân thiện. */
export function problemMessage(problem: PhotoProblem) {
  switch (problem) {
    case 'blurry':
      return 'Ảnh hơi mờ, cô chưa đọc rõ chữ của con. Con giữ chắc máy rồi chụp lại nhé.';
    case 'dark':
      return 'Ảnh hơi tối. Con ra chỗ sáng hơn rồi chụp lại nhé.';
    case 'glare':
      return 'Ảnh bị lóa đèn, có chỗ trắng xoá. Con nghiêng trang giấy một chút rồi chụp lại nhé.';
  }
}
