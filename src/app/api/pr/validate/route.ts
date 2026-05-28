import { z } from "zod";
import { collectPullRequest, parseGitHubPrUrl } from "@/lib/server/github";
import { jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  prUrl: z.string().min(1),
});

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "PR URL을 입력해 주세요.");
  }

  const parsed = parseGitHubPrUrl(body.data.prUrl);
  if (!parsed) {
    return jsonError(400, "INVALID_PR_URL", "공개 GitHub Pull Request URL 형식이 아닙니다.");
  }

  try {
    const pr = await collectPullRequest(body.data.prUrl);
    return Response.json({
      ok: true,
      repository: `${pr.owner}/${pr.repo}`,
      pullNumber: pr.pullNumber,
      title: pr.title,
      fileCount: pr.files.length,
      diffLength: pr.diffText.length,
    });
  } catch (error) {
    const code = (error as { code?: string }).code ?? "PR_VALIDATE_FAILED";
    if (code === "INSUFFICIENT_DIFF") {
      return jsonError(
        422,
        "INSUFFICIENT_DIFF",
        "이 PR은 변경 내용이 너무 적어 3개의 문제를 만들기 어렵습니다."
      );
    }
    return jsonError(400, code, "PR 정보를 불러오지 못했습니다.");
  }
}
