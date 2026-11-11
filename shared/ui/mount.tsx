import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { IeungDefs } from "./Ieung";

/**
 * apps/<slug>/main.tsx 에서 부른다. index.html 의 <div id="root"> 에 그린다.
 * 이응 그림이 쓰는 symbol·그라데이션을 여기서 한 번 깔아서, 어느 화면에서
 * <Ieung> 을 써도 몸통이 빠지지 않는다.
 */
export function mount(node: ReactNode) {
  // iOS Safari 는 touch 리스너가 없으면 :active 를 안 건다 (#41). passive 라 스크롤을 막지 않는다
  document.addEventListener("touchstart", () => {}, { passive: true });
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <IeungDefs />
      {node}
    </StrictMode>,
  );
}
