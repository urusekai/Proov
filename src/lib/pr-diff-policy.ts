/** PR diff 수집·제한 정책 (.docs/spec.md, github.ts와 동기화) */
export const PR_DIFF_LIMITS = {
  maxFiles: 8,
  maxTotalDiffChars: 12_000,
  maxPatchCharsPerFile: 3_000,
  maxPrBodyChars: 1_000,
  minChangedLines: 5,
} as const;

export type PrDiffGuidanceItem = {
  title: string;
  detail: string;
};

function formatCount(n: number) {
  return n.toLocaleString("ko-KR");
}

/** 문제 만들기 화면 등에서 사용자에게 보여줄 안내 문구 */
export function getPrDiffGuidanceItems(): PrDiffGuidanceItem[] {
  const { maxFiles, maxTotalDiffChars, maxPatchCharsPerFile, minChangedLines } = PR_DIFF_LIMITS;

  return [
    {
      title: "공개 GitHub PR만 사용할 수 있어요",
      detail:
        "비공개 저장소는 지원하지 않습니다. URL은 https://github.com/owner/repo/pull/123 형식이어야 합니다.",
    },
    {
      title: "실제 코드 변경이 있어야 해요",
      detail: `lock·빌드 산출물·이미지 등을 제외한 뒤, 추가·삭제 줄 수 합이 ${minChangedLines}줄 미만이면 문제를 만들 수 없습니다.`,
    },
    {
      title: "일부 파일·경로는 분석에서 빠집니다",
      detail:
        "package-lock 등 lock 파일, dist/build/coverage/.next/node_modules, 이미지·폰트 등 바이너리, .min.js·.min.css, GitHub에 diff 본문이 없는 파일은 제외됩니다.",
    },
    {
      title: "변경 파일과 diff 크기에 상한이 있어요",
      detail: `분석에 쓰이는 변경 파일은 최대 ${maxFiles}개이며, 전체 diff는 ${formatCount(maxTotalDiffChars)}자, 파일당 patch는 ${formatCount(maxPatchCharsPerFile)}자까지만 AI에 전달됩니다. 큰 PR은 앞부분만 반영될 수 있습니다.`,
    },
  ];
}
