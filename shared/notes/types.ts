import type { Bi, Block } from "../doc";
import type { Accent } from "../ui/parts";
import type { CategorySlug } from "./categories";

/** 글 하나 = 주소 하나 /notes/<slug>/ (#50) */
export type Note = {
  /** 주소. 영어 낱말. 한번 나가면 바꾸지 않는다 — 제목을 고쳐도 그대로 */
  slug: string;
  /** 처음 올린 날 (YYYY-MM-DD). 목록은 최신순 */
  added: string;
  /** 고친 날 */
  updated?: string;
  /** 화면 제목 — 질문 꼴. 영어가 크고 한국어가 아래 (#94 · #102) */
  title: Bi;
  /** 검색 결과 제목 앞부분 — 학습자가 영어로 검색하는 말 */
  searchTitle: string;
  /** meta description — 영어 먼저 + 한국어 */
  description: string;
  /** 목록 · 앱 아래 링크 카드의 한 줄 */
  summary: Bi;
  /** 분류 하나 (shared/notes/categories.ts, #116) */
  category: CategorySlug;
  /** 목록 썸네일 — 악센트 바탕 네모 + 그림 글자(이모지). 색만으로 구분하지 않게 mark 를 같이 */
  thumb: { tone: Accent; mark: string };
  /** 관련 앱 slug — 글 끝 「앱에서 연습하기」, 그 앱 아래 링크 카드 */
  apps: string[];
  /** 본문 (shared/doc.ts). 설명 글은 영어만, 배우는 한국어(ex · cards · ieung)는 한국어 + 영어 (#122) */
  blocks: Block[];
};
