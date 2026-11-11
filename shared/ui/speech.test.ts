import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* speechSynthesis 가짜. speech.ts 는 불러올 때 canSpeak 를 정하므로
   전역을 깐 뒤 매번 새로 import 한다. */
type Voice = { lang: string; name: string; localService: boolean };

class FakeUtterance {
  lang = "";
  rate = 1;
  voice: Voice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function setup(initialVoices: Voice[] = []) {
  const vc = new Set<() => void>();
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    voices: initialVoices,
    getVoices: vi.fn(() => synth.voices),
    speak: vi.fn((_u: FakeUtterance) => {}),
    cancel: vi.fn(),
    resume: vi.fn(),
    addEventListener: (_: string, fn: () => void) => vc.add(fn),
    removeEventListener: (_: string, fn: () => void) => vc.delete(fn),
    fireVoices(v: Voice[]) {
      synth.voices = v;
      vc.forEach((fn) => fn());
    },
  };
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("document", { hidden: false, addEventListener: () => {} });
  vi.stubGlobal("addEventListener", () => {});
  vi.stubGlobal("navigator", { userAgent: "test", platform: "", maxTouchPoints: 0 });
  return synth;
}

const ko: Voice = { lang: "ko-KR", name: "Yuna", localService: true };
const lastU = (s: ReturnType<typeof setup>) => s.speak.mock.calls.at(-1)![0];

describe("speak()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("말하는 중이 아니면 cancel 없이 같은 tick 에 말한다", async () => {
    const s = setup([ko]);
    const { speak } = await import("./speech");
    speak("기역");
    expect(s.cancel).not.toHaveBeenCalled();
    expect(s.speak).toHaveBeenCalledTimes(1);
    expect(lastU(s).text).toBe("기역");
    expect(lastU(s).lang).toBe("ko-KR");
    expect(lastU(s).rate).toBe(0.8);
  });

  it("말하는 중이고 아직 unlocked 전이면 cancel 뒤 동기로 말한다", async () => {
    const s = setup([ko]);
    const { speak } = await import("./speech");
    s.speaking = true;
    speak("니은");
    expect(s.cancel).toHaveBeenCalledTimes(1);
    expect(s.speak).toHaveBeenCalledTimes(1);
  });

  it("unlocked 뒤 연타하면 마지막 것만 말한다", async () => {
    const s = setup([ko]);
    const { speak } = await import("./speech");
    speak("가");
    lastU(s).onstart?.(); // 소리가 났다 → unlocked
    s.speaking = true;
    speak("나");
    speak("다");
    speak("라");
    expect(s.speak).toHaveBeenCalledTimes(1);
    vi.runAllTimers();
    expect(s.speak).toHaveBeenCalledTimes(2);
    expect(lastU(s).text).toBe("라");
  });

  it("voiceschanged 가 오면 다음 speak 에 한국어 목소리가 들어간다", async () => {
    const s = setup([]);
    const { speak } = await import("./speech");
    speak("가");
    expect(lastU(s).voice).toBeNull();
    s.fireVoices([{ lang: "en-US", name: "Sam", localService: true }, ko]);
    speak("나");
    expect(lastU(s).voice).toBe(ko);
  });

  it("기기 안 ko-KR 목소리를 먼저 고른다", async () => {
    const remote: Voice = { lang: "ko_KR", name: "Enhanced", localService: false };
    const s = setup([remote, ko]);
    const { speak } = await import("./speech");
    speak("가");
    expect(lastU(s).voice).toBe(ko);
  });

  it("한국어 목소리가 없으면 voice 없이 lang 만 ko-KR", async () => {
    const s = setup([{ lang: "en-US", name: "Sam", localService: true }]);
    const { speak, hasKoreanVoice } = await import("./speech");
    speak("가");
    expect(lastU(s).voice).toBeNull();
    expect(lastU(s).lang).toBe("ko-KR");
    expect(hasKoreanVoice()).toBe(false);
  });

  it("paused 면 resume 한다", async () => {
    const s = setup([ko]);
    const { speak } = await import("./speech");
    s.paused = true;
    speak("가");
    expect(s.resume).toHaveBeenCalled();
  });

  it("onSpeak 듣는 쪽에 알린다 (SoundHint)", async () => {
    setup([ko]);
    const { speak, onSpeak } = await import("./speech");
    const fn = vi.fn();
    const off = onSpeak(fn);
    speak("가");
    off();
    speak("나");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("목록이 아직 비었으면 hasKoreanVoice 는 null", async () => {
    setup([]);
    const { hasKoreanVoice } = await import("./speech");
    expect(hasKoreanVoice()).toBeNull();
  });
});
