/** Proov 로고 마크 (viewBox 0 0 44 44) */
export const PROOV_LOGO_PATH =
  "M13.2969 18.5801C12.7563 19.7463 12.4531 21.045 12.4531 22.415C12.4531 27.4585 16.5415 31.5469 21.585 31.5469C22.9548 31.5469 24.2528 31.2426 25.4189 30.7021L38.3613 43.6445C37.6149 43.8748 36.8221 44 36 44H8C3.58172 44 1.28855e-07 40.4183 0 36V8C2.3982e-08 7.17769 0.124055 6.38435 0.354492 5.6377L13.2969 18.5801ZM36 0C40.4183 1.28851e-07 44 3.58172 44 8V36C44 36.8221 43.8748 37.6149 43.6445 38.3613L30.3301 25.0469C30.5806 24.2134 30.7168 23.3302 30.7168 22.415C30.7168 17.3716 26.6284 13.2832 21.585 13.2832C20.6696 13.2832 19.7859 13.4183 18.9521 13.6689L5.6377 0.354492C6.38435 0.124055 7.17769 2.39812e-08 8 0H36Z";

export const siteConfig = {
  name: "Proov",
  title: "Proov | PR 기반 코드 학습",
  shortTitle: "Proov | PR 기반 코드 학습",
  description:
    "실제 GitHub PR 코드를 바탕으로 AI가 출제하는 맞춤형 문제를 풀며, 실무 코드 이해력과 아키텍처 이해도를 증명하세요.",
  ogDescription:
    "AI가 코드를 짜는 시대, 구현보다 이해가 중요합니다. 실제 GitHub PR diff로 코드 이해력을 키워보세요.",
  keywords: [
    "Proov",
    "코드 이해력",
    "GitHub PR",
    "개발 학습",
    "코드 리뷰",
    "실무 코드",
    "오픈소스",
  ],
} as const;

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
