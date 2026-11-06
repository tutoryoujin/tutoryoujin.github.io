/** 브라우저 TTS 로 한국어를 읽어 준다. 한국어 목소리가 없으면 있는 것 중에서. */
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.8; // 학습자용 — 조금 천천히
  const voice = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ko"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

// 목소리 목록은 처음 부를 때 비어 있는 브라우저가 있어서 미리 깨운다
if (canSpeak) speechSynthesis.getVoices();
