/* ============================================================
   브라우저 TTS 로 한국어를 읽어 준다. 모든 🔊 가 speak() 하나를 지난다.

   iOS Safari 에서 지킬 것 (#40):
   - 첫 speak 는 탭 핸들러 안에서 **동기로**. await · setTimeout 뒤면 조용히 버린다.
   - 말하는 중이 아닐 때 cancel() 하지 않는다. 구버전 WebKit 은 cancel 콜백이
     늦게 와서 바로 뒤의 utterance 까지 지운다 (WebKit 191745).
   - 백그라운드에 갔다 오면 합성기가 멈춰 있을 수 있다 → 숨을 때 비우고, paused 면 resume.
   - 무음 스위치가 켜져 있으면 소리가 안 나는데 코드로 알 수 없다 → SoundHint 로 안내.
   ============================================================ */
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

let voices: SpeechSynthesisVoice[] = [];
/** 말하는 utterance 를 잡아 둔다 — GC 되면 onend 가 안 오는 브라우저가 있다 */
let current: SpeechSynthesisUtterance | null = null;
/** 이 페이지에서 제스처 안의 speak 가 한 번 소리를 냈는지. 그 뒤로만 잠깐 미룰 수 있다 */
let unlocked = false;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let sessionTried = false;
const listeners = new Set<() => void>();

const isKo = (v: SpeechSynthesisVoice) => (v.lang ?? "").replace("_", "-").toLowerCase().startsWith("ko");
const loadVoices = () => {
  voices = speechSynthesis.getVoices();
};

if (canSpeak) {
  // 목소리 목록은 처음 부를 때 비어 있는 브라우저가 있어서 미리 깨우고, 바뀌면 다시 받는다
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  // 백그라운드에서 멈춘 합성기 정리
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) speechSynthesis.cancel();
  });
  addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) speechSynthesis.cancel();
  });
}

/** ko-KR 이면서 기기 안 목소리 먼저. 없으면 아무 한국어. 그것도 없으면 undefined (lang 만으로 말하게) */
function koVoice(): SpeechSynthesisVoice | undefined {
  const ko = voices.filter(isKo);
  return ko.find((v) => v.lang.replace("_", "-").toLowerCase() === "ko-kr" && v.localService) ?? ko[0];
}

/**
 * iOS 17+ : 오디오 세션을 playback 으로 두면 무음 스위치를 넘는다(미디어 채널).
 * speechSynthesis 에도 듣는지는 실제 iPhone 에서 확인 중 — 없는 브라우저에선 아무 일도 안 한다.
 * #39 의 mp3(<audio>) 도 이걸 쓴다.
 */
export function playThroughSilentSwitch() {
  if (sessionTried) return;
  sessionTried = true;
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* 지원 안 함 */
  }
}

function say(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.8; // 학습자용 — 조금 천천히
  const v = koVoice();
  if (v) u.voice = v;
  current = u;
  u.onstart = () => {
    unlocked = true;
  };
  u.onend = u.onerror = () => {
    if (current === u) current = null;
  };
  speechSynthesis.speak(u);
}

export function speak(text: string) {
  if (!canSpeak || !text) return;
  playThroughSilentSwitch();
  const s = speechSynthesis;
  if (s.paused) s.resume();
  clearTimeout(pendingTimer);
  listeners.forEach((fn) => fn());
  // 말하는 중이 아니면 cancel 하지 않고 바로
  if (!s.speaking && !s.pending) return say(text);
  s.cancel();
  // 제스처로 한 번 열린 페이지에서만 잠깐 미룬다 — 연타하면 마지막 것만. 처음이면 동기로 바로
  if (unlocked) pendingTimer = setTimeout(() => say(text), 60);
  else say(text);
}

/** speak() 가 불릴 때마다 (SoundHint 가 듣는다). 되돌린 함수로 그만 듣는다 */
export function onSpeak(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * 이 기기에 한국어 목소리가 있는지. 목록이 아직 안 왔으면 null.
 * 없으면 speak() 는 다른 언어 목소리로 한국어를 읽는다 — 학생에게 알려 줘야 한다.
 */
export function hasKoreanVoice(): boolean | null {
  if (!canSpeak) return false;
  if (voices.length === 0) loadVoices();
  if (voices.length === 0) return null;
  return voices.some(isKo);
}

/** 목소리 목록이 바뀌면(처음 도착하면) 부른다. 되돌린 함수로 그만 듣는다 */
export function onVoicesChanged(fn: () => void): () => void {
  if (!canSpeak) return () => {};
  // 캐시가 먼저 갱신되게 loadVoices 다음에 등록된다 (모듈을 불러올 때 이미 걸었다)
  speechSynthesis.addEventListener("voiceschanged", fn);
  return () => speechSynthesis.removeEventListener("voiceschanged", fn);
}

/** iPhone · iPad (iPadOS 는 데스크톱 UA 라 터치 수로 가른다) */
export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
