import { Alert } from 'react-native';

import { levelPrompt, levelSchema } from '../../supabase/functions/_shared/cham-bai';
import type { GradingResult } from '@/lib/grading';

// Sau khi AI chấm: kiểm tra ảnh có phải bài tập không, và bài có hợp với lớp của bé không.
// AI nhận biết trong cùng lần chấm (xem isHomework / detectedGrade / fitsGrade trong cham-bai.ts),
// nên không tốn thêm lượt gọi AI.

export type LevelVerdict =
  | { kind: 'ok' }
  | { kind: 'not-homework' }
  | { kind: 'wrong-grade'; detectedGrade: number };

export function checkLevel(result: GradingResult, grade: number): LevelVerdict {
  if (result.isHomework === false) return { kind: 'not-homework' };
  const detected = Number.isInteger(result.detectedGrade) ? (result.detectedGrade as number) : 0;
  const detectedGrade = detected >= 1 && detected <= 5 ? detected : 0;
  // Có lớp AI nhận ra: app tự so (hợp nếu đúng lớp, hoặc ôn bài lớp ngay dưới), không tin hẳn fitsGrade
  // vì AI nhỏ chạy trên máy hay nói theo lớp đã khai báo.
  if (detectedGrade) {
    const fits = detectedGrade === grade || detectedGrade === grade - 1;
    return fits ? { kind: 'ok' } : { kind: 'wrong-grade', detectedGrade };
  }
  // Không rõ lớp: chỉ báo khi AI nói rõ là không hợp (bài chấm cũ không có các trường này thì bỏ qua).
  if (result.fitsGrade === false) return { kind: 'wrong-grade', detectedGrade: 0 };
  return { kind: 'ok' };
}

const lmStudioUrl = process.env.EXPO_PUBLIC_LMSTUDIO_URL?.replace(/\/+$/, '');
const lmStudioModel = process.env.EXPO_PUBLIC_LMSTUDIO_MODEL;

/**
 * Bài chấm bằng LM Studio: hỏi riêng lớp của bài (không kèm lớp khai báo, mất vài giây) rồi ghi đè
 * vào kết quả. Hỏi không được thì giữ nguyên kết quả chấm.
 */
export async function detectLevelLocally(images: string[], result: GradingResult): Promise<GradingResult> {
  if (!lmStudioUrl) return result;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        ...(lmStudioModel ? { model: lmStudioModel } : {}),
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_schema', json_schema: { name: 'nhan_biet_lop', strict: true, schema: levelSchema } },
        messages: [
          { role: 'system', content: levelPrompt },
          {
            role: 'user',
            content: [
              // Hai trang đầu là đủ để nhận biết lớp, lại nhanh hơn.
              ...images.slice(0, 2).map((image) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image}` },
              })),
              { type: 'text', text: 'Bài này lớp mấy?' },
            ],
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`LM Studio trả lỗi ${response.status}`);
    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    // Model có suy luận có lúc để kết quả JSON trong reasoning_content (xem askLmStudio ở grading.ts).
    const content: string = message?.content || message?.reasoning_content || '';
    const level = JSON.parse(content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1)) as {
      isHomework?: boolean;
      detectedGrade?: number;
    };
    return { ...result, isHomework: level.isHomework, detectedGrade: level.detectedGrade };
  } catch (error) {
    console.warn('Chưa nhận biết được lớp của bài:', error);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/** Bố mẹ chọn gì khi bài không hợp lớp. */
export type LevelChoice = 'retake' | 'change-grade' | 'keep';

/** Hỏi bố mẹ bằng hộp thoại; trả về lựa chọn. */
export function askAboutLevel(verdict: LevelVerdict, grade: number): Promise<LevelChoice> {
  return new Promise((resolve) => {
    if (verdict.kind === 'not-homework') {
      Alert.alert(
        'Ảnh này chưa phải bài tập',
        'Cô chưa thấy bài tập trong ảnh. Con chụp lại trang vở hoặc phiếu bài tập cho rõ, đủ cả trang nhé!',
        [{ text: 'Chụp lại', onPress: () => resolve('retake') }],
        { cancelable: false },
      );
      return;
    }
    if (verdict.kind !== 'wrong-grade') {
      resolve('keep');
      return;
    }
    const { detectedGrade } = verdict;
    const title = detectedGrade ? `Bài này giống bài lớp ${detectedGrade}` : `Bài này chưa giống bài lớp ${grade}`;
    const message = detectedGrade
      ? `Bài đang được chấm theo lớp ${grade}, nhưng bài trong ảnh là kiến thức lớp ${detectedGrade}. ` +
        `Bố mẹ chụp lại đúng bài của bé, hoặc đổi hồ sơ sang lớp ${detectedGrade} nhé.`
      : `Bài đang được chấm theo lớp ${grade}, nhưng bài trong ảnh không giống chương trình lớp ${grade}. ` +
        'Bố mẹ chụp lại đúng bài của bé, hoặc kiểm tra lại lớp trong hồ sơ nhé.';
    Alert.alert(
      title,
      message,
      [
        { text: 'Chụp lại ảnh khác', onPress: () => resolve('retake') },
        ...(detectedGrade
          ? [{ text: `Đổi hồ sơ sang lớp ${detectedGrade}`, onPress: () => resolve('change-grade' as const) }]
          : []),
        { text: `Vẫn xem kết quả lớp ${grade}`, style: 'cancel' as const, onPress: () => resolve('keep') },
      ],
      { cancelable: false },
    );
  });
}
