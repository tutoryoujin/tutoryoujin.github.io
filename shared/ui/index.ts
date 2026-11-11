/* 공통 컴포넌트. 앱에서는 이 파일만 import 한다.
     import { mount, Page, Tabs, Quiz } from "@yj/ui";            */
import "./styles.css";

export { Page, Footer, mainClass, type NavLink } from "./Page";
export { cn } from "./cn";
export { useTheme, THEME_KEY, type ThemePref } from "./theme";
export { Ieung, type Mood } from "./Ieung";
export { Bubble, pokeClass } from "./Bubble";
export { Quiz, type Question, type Choice } from "./Quiz";
export { Box, boxClass, Btn, ListenBtn, Seg, Segments, Note, Tabs, useHashTab, type TabDef, type Accent, type Tone } from "./parts";
export { speak, canSpeak, hasKoreanVoice, onVoicesChanged, onSpeak, isIOS, playThroughSilentSwitch } from "./speech";
export { SoundHint, SOUND_HINT_KEY } from "./SoundHint";
export { mount } from "./mount";
export { Subscribe } from "./Subscribe";
export { Products } from "./Products";
export { track, type EventName } from "../analytics";
