/* ============================================================
   화면 테마 — 자동(기기 설정) · 밝게 · 어둡게.

   <html data-theme="light|dark"> 하나로 정한다. 자동이면 속성을 지운다.
   색은 tokens.css 가 세 상태를 다 갖고 있어서 여기서는 속성만 바꾼다.

   첫 그림 전에 같은 일을 하는 짧은 스크립트가 vite.config.ts 에서 모든
   index.html 의 <head> 에 들어간다 (THEME_BOOT). 그게 없으면 어둡게를
   고른 사람도 새로고침마다 밝은 화면이 한 번 번쩍인다.
   ============================================================ */
import { useEffect, useState } from "react";

export type ThemePref = "auto" | "light" | "dark";
/** 모든 앱이 같이 쓴다. 바꾸면 학생들이 고른 테마가 풀린다 */
export const THEME_KEY = "yj:theme";

const read = (): ThemePref => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
};

const apply = (t: ThemePref) => {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
};

const darkQuery = () => matchMedia("(prefers-color-scheme: dark)");

/**
 * 고른 테마(theme), 지금 실제로 어두운지(dark), 바꾸는 함수.
 * 자동일 때 dark 는 기기 설정을 따라가고, 다른 탭에서 바꿔도 따라온다.
 */
export function useTheme(): { theme: ThemePref; dark: boolean; setTheme: (t: ThemePref) => void } {
  const [theme, setTheme] = useState<ThemePref>(read);
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches);
  useEffect(() => {
    const q = darkQuery();
    const on = () => setSystemDark(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== THEME_KEY) return;
      const t = read();
      apply(t);
      setTheme(t);
    };
    addEventListener("storage", on);
    return () => removeEventListener("storage", on);
  }, []);
  const set = (t: ThemePref) => {
    try {
      if (t === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, t);
    } catch {
      /* 저장이 막힌 브라우저 — 이 화면에서만 바뀐다 */
    }
    apply(t);
    setTheme(t);
  };
  return { theme, dark: theme === "auto" ? systemDark : theme === "dark", setTheme: set };
}

/** <head> 에 그대로 들어가는 스크립트. 위 read/apply 와 같은 일을 한다 */
export const THEME_BOOT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
