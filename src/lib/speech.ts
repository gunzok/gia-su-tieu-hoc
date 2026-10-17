import * as Speech from 'expo-speech';

export function speakVietnamese(text: string, callbacks?: { onDone?: () => void }) {
  Speech.stop();
  Speech.speak(text, {
    language: 'vi-VN',
    rate: 0.9,
    onDone: callbacks?.onDone,
    onStopped: callbacks?.onDone,
    onError: callbacks?.onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
