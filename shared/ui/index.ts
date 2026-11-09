/* 공통 컴포넌트. 앱에서는 이 파일만 import 한다.
     import { mount, Page, Tabs, Quiz } from "@yj/ui";            */
import "./styles.css";

export { Page, Footer, mainClass, type NavLink } from "./Page";
export { cn } from "./cn";
export { useTheme, THEME_KEY, type ThemePref } from "./theme";
export { Ieung, type Mood } from "./Ieung";
export { Quiz, type Question, type Choice } from "./Quiz";
export { Box, boxClass, Btn, ListenBtn, Seg, Segments, Note, Tabs, useHashTab, type TabDef, type Accent, type Tone } from "./parts";
export { speak, canSpeak, hasKoreanVoice, onVoicesChanged } from "./speech";
export { mount } from "./mount";
