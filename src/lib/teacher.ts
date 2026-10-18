// Gia sư đồng hành với bé: Cô giáo (mặc định) hoặc Thầy giáo (chỉ gói Plus).
// Quyết định hình ảnh, cách xưng hô trong giao diện, lời AI nhận xét và giọng đọc.

export type TeacherId = 'co' | 'thay';

export const APP_NAME = 'Gia sư Tiểu học';

export const teachers = {
  co: {
    id: 'co' as const,
    /** Viết hoa đầu câu / khi gọi tên: "Cô chấm bài nhé!" */
    Title: 'Cô',
    /** Giữa câu: "con đợi cô một chút" */
    word: 'cô',
    name: 'Cô giáo',
    fullBody: require('@/assets/images/co-giao.png'),
    face: require('@/assets/images/co-giao-mat.png'),
  },
  thay: {
    id: 'thay' as const,
    Title: 'Thầy',
    word: 'thầy',
    name: 'Thầy giáo',
    fullBody: require('@/assets/images/thay-giao.png'),
    face: require('@/assets/images/thay-giao-mat.png'),
  },
};

export type Teacher = (typeof teachers)[TeacherId];

export function teacherOf(id: TeacherId | undefined): Teacher {
  return teachers[id ?? 'co'] ?? teachers.co;
}
