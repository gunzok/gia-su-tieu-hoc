import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import type { Teacher } from '@/lib/teacher';

// Lời chào ở Trang chủ: mỗi lần mở app chọn một câu khác (không trùng câu lần trước).

type Greeting = { title: string; body: string };
type Maker = (name: string, T: Teacher) => Greeting;

const greetings: Maker[] = [
  (name, T) => ({ title: `Chào ${name}! 🌟`, body: `Hôm nay ${T.word} trò mình cùng làm bài tập thật nhanh nhé!` }),
  (name, T) => ({ title: `${T.Title} chào ${name}! 👋`, body: `Con đã sẵn sàng khám phá bài học mới cùng ${T.word} chưa?` }),
  (name, T) => ({ title: `${name} đến rồi! 🎈`, body: `${T.Title} nhớ con lắm. Mình cùng làm bài nào!` }),
  (name, T) => ({ title: `Xin chào ${name}! ☀️`, body: `Làm xong bài, con chụp ảnh gửi ${T.word} chấm nhé!` }),
  (name, T) => ({ title: `Chào ${name} chăm chỉ! 💪`, body: `Mỗi ngày một chút, con sẽ giỏi hơn hôm qua. ${T.Title} tin con!` }),
  (name, T) => ({ title: `${name} ơi! 📚`, body: `Hôm nay con học bài gì? Có chỗ nào khó, ${T.word} giảng cho con nghe nhé.` }),
  (name, T) => ({ title: `Chào ${name}! 🌈`, body: `Sai cũng không sao đâu con, ${T.word} sẽ cùng con sửa thật kỹ.` }),
  (name, T) => ({ title: `${T.Title} đây rồi, ${name}! 🦉`, body: `Con làm bài cẩn thận, đọc kỹ đề trước khi làm nhé!` }),
  (name, T) => ({ title: `Chào ${name} giỏi giang! ⭐`, body: `Cùng ${T.word} chinh phục bài tập hôm nay nào!` }),
  (name, T) => ({ title: `${name} ơi, vào học thôi! 🚀`, body: `Con làm xong, ${T.word} chấm ngay và khen con liền!` }),
];

function timeGreeting(name: string, T: Teacher): Greeting | null {
  const hour = new Date().getHours();
  if (hour < 11) return { title: `Chào buổi sáng ${name}! 🌤️`, body: `Sáng nay con khoẻ không? Mình cùng ôn bài với ${T.word} nhé!` };
  if (hour >= 18) return { title: `Chào buổi tối ${name}! 🌙`, body: `Làm bài xong sớm để còn nghỉ ngơi nha con. ${T.Title} giúp con!` };
  return null;
}

const STORAGE_KEY = 'loi-chao-truoc';
// Chọn một lần cho mỗi lần mở app, để quay lại Trang chủ không bị đổi câu liên tục.
let chosen: Promise<number> | null = null;

function chooseIndex() {
  chosen ??= (async () => {
    // Thêm 1 vị trí cho lời chào theo buổi (nếu có).
    const count = greetings.length + 1;
    let last = -1;
    try {
      last = Number(await AsyncStorage.getItem(STORAGE_KEY) ?? -1);
    } catch {}
    let index = Math.floor(Math.random() * count);
    if (index === last) index = (index + 1 + Math.floor(Math.random() * (count - 1))) % count;
    AsyncStorage.setItem(STORAGE_KEY, String(index)).catch(() => {});
    return index;
  })();
  return chosen;
}

let lastIndex: number | null = null;

/** Lời chào hôm nay cho bé. */
export function useGreeting(name: string, T: Teacher): Greeting {
  const [index, setIndex] = useState<number | null>(lastIndex);
  useEffect(() => {
    chooseIndex().then((value) => {
      lastIndex = value;
      setIndex(value);
    });
  }, []);
  const make = index === null || index >= greetings.length ? null : greetings[index];
  const greeting = make ? make(name, T) : (timeGreeting(name, T) ?? greetings[0](name, T));
  // Tên có thể là "con yêu" (bé chưa nhập tên): viết hoa chữ đầu câu.
  return { ...greeting, title: greeting.title.charAt(0).toUpperCase() + greeting.title.slice(1) };
}
