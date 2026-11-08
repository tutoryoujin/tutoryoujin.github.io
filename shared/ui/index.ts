/* 공통 컴포넌트. 앱에서는 이 파일만 import 한다.
     import { mount, Page, Tabs, Quiz } from "@yj/ui";            */
import "../tokens/tokens.css";
import "./shell.css";
import "./base.css";

export { Page, type NavLink } from "./Page";
export { Ieung, type Mood } from "./Ieung";
export { Quiz, type Question, type Choice } from "./Quiz";
export { Box, Btn, ListenBtn, Seg, Segments, Note, Tabs, useHashTab, type TabDef, type Accent, type Tone } from "./parts";
export { speak, canSpeak, hasKoreanVoice, onVoicesChanged } from "./speech";
export { mount } from "./mount";
