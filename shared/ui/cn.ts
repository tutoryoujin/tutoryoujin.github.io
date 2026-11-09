import { extendTailwindMerge } from "tailwind-merge";
import { TEXT_SIZES } from "../tokens/theme";

/**
 * 클래스 합치기. 뒤에 온 유틸리티가 앞의 같은 종류를 이긴다.
 *   cn("mt-3.5 min-h-14", className)   ← 앱이 넘긴 className 이 이긴다
 *
 * text-label 같은 타입 스케일 이름은 tailwind-merge 가 모르면 글자색으로
 * 여겨서 text-muted 와 부딪힌다(하나가 지워진다). 그래서 알려 준다.
 */
export const cn = extendTailwindMerge({
  extend: { theme: { text: [...TEXT_SIZES] } },
});
