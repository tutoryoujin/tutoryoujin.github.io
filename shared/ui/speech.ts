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

/**
 * 이 기기에 한국어 목소리가 있는지. 목록이 아직 안 왔으면 null.
 * 없으면 speak() 는 다른 언어 목소리로 한국어를 읽는다 — 학생에게 알려 줘야 한다.
 */
export function hasKoreanVoice(): boolean | null {
  if (!canSpeak) return false;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return voices.some((v) => v.lang?.toLowerCase().startsWith("ko"));
}

/** 목소리 목록이 바뀌면(처음 도착하면) 부른다. 되돌린 함수로 그만 듣는다 */
export function onVoicesChanged(fn: () => void): () => void {
  if (!canSpeak) return () => {};
  speechSynthesis.addEventListener("voiceschanged", fn);
  return () => speechSynthesis.removeEventListener("voiceschanged", fn);
}

// 목소리 목록은 처음 부를 때 비어 있는 브라우저가 있어서 미리 깨운다
if (canSpeak) speechSynthesis.getVoices();
