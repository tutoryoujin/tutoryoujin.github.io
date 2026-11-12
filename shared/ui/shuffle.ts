/** 고르게 섞기 (Fisher–Yates). 원본은 그대로 두고 새 배열을 준다.
    sort(() => Math.random() - 0.5) 는 치우치니 쓰지 않는다 */
export function shuffle<T>(arr: readonly T[], random: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
