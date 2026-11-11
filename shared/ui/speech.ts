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

/** 0.1초 무음 WAV (8kHz · 8bit · mono). 파일 없이 만든다 */
function silentWavUrl(): string {
  const n = 800;
  const b = new DataView(new ArrayBuffer(44 + n));
  const str = (o: number, s: string) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  b.setUint32(4, 36 + n, true);
  str(8, "WAVEfmt ");
  b.setUint32(16, 16, true);
  b.setUint16(20, 1, true); // PCM
  b.setUint16(22, 1, true); // mono
  b.setUint32(24, 8000, true);
  b.setUint32(28, 8000, true);
  b.setUint16(32, 1, true);
  b.setUint16(34, 8, true);
  str(36, "data");
  b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128); // 8bit 의 0 은 128
  return URL.createObjectURL(new Blob([b.buffer], { type: "audio/wav" }));
}
/** 재생 중에 GC 되지 않게 잡아 둔다 */
let silent: HTMLAudioElement | null = null;

/**
 * 무음 스위치 넘기 — 첫 speak 때 두 방법을 **같이** 건다.
 * 무음이어도 TTS 이벤트가 정상으로 와서 어느 쪽이 통했는지 코드로 알 수 없기 때문이다.
 * 하나라도 통하면 들리고, 둘 다 안 되면 아무 일도 없다 (SoundHint 가 안내).
 *  1. iOS 17+ navigator.audioSession = "playback" — 웹판 AVAudioSession
 *  2. iOS 에서만: 무음 <audio> 를 한 번 재생해 페이지 오디오를 미디어 채널로 돌린다
 * 둘 다 speechSynthesis 에 듣는지는 실제 iPhone 에서 확인할 것. #39 의 mp3 도 이걸 쓴다.
 * 탭 핸들러 안에서 동기로 불려야 한다 (play() 가 제스처를 요구).
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
  if (!isIOS() || typeof Audio === "undefined") return;
  try {
    silent = new Audio(silentWavUrl());
    silent.play()?.catch(() => {}).finally(() => {
      silent = null;
    });
  } catch {
    silent = null;
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
