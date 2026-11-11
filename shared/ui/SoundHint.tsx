import { useEffect, useState } from "react";
import { Note } from "./parts";
import { canSpeak, isIOS, onSpeak } from "./speech";

/** 닫았는지. kcards:* 와 섞이지 않게 yj: 아래 */
export const SOUND_HINT_KEY = "yj:soundhint";

const dismissed = () => {
  try {
    return localStorage.getItem(SOUND_HINT_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * iPhone 무음 스위치 안내 (#40). 무음이면 Safari 의 TTS 가 소리 없이 "끝까지 말한" 것처럼
 * 이벤트가 와서 코드로는 알 수 없다. 그래서 iOS 에서 처음 🔊 를 누른 뒤 한 번만 띄우고,
 * 닫으면 다시 띄우지 않는다. <Page> 가 그린다 — 앱에서 따로 넣지 않는다.
 */
export function SoundHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!canSpeak || !isIOS() || dismissed()) return;
    const off = onSpeak(() => {
      setShow(true);
      off();
    });
    return off;
  }, []);
  if (!show) return null;

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(SOUND_HINT_KEY, "1");
    } catch {
      /* 저장 못 해도 이번엔 닫힌다 */
    }
  };
  return (
    <div className="fixed inset-x-0 bottom-[calc(--spacing(3)+env(safe-area-inset-bottom,0px))] z-20 mx-auto w-full max-w-(--shell-width) px-4" role="status">
      <div className="relative rounded-md bg-surface shadow-card">
        <Note tone="gray" className="mt-0 pr-13" ko="소리가 안 들리면 아이폰의 무음 모드를 꺼 주세요." en="No sound? Turn off Silent mode on your iPhone." />
        <button
          type="button"
          className="absolute top-0 right-0 grid size-11 place-items-center rounded-sm text-[1.2rem] text-muted"
          aria-label="닫기 / Close"
          onClick={close}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
