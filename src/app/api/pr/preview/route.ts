import { z } from "zod";
import { fetchPullRequestPreview } from "@/lib/server/github";
import { getAuthenticatedUser, jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  prUrl: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "PR URL을 입력해 주세요.");
  }

  try {
    const preview = await fetchPullRequestPreview(body.data.prUrl);
    return Response.json({
      repository: preview.repository,
      pullNumber: preview.pullNumber,
      title: preview.title,
      prUrl: preview.prUrl,
    });
  } catch (error) {
    const code = (error as { code?: string }).code ?? "PR_PREVIEW_FAILED";
    if (code === "INVALID_PR_URL") {
      return jsonError(400, "INVALID_PR_URL", "공개 GitHub Pull Request URL 형식이 아닙니다.");
    }
    if (code === "PR_NOT_FOUND") {
      return jsonError(404, "PR_NOT_FOUND", "PR을 찾을 수 없습니다. 비공개 저장소이거나 존재하지 않는 PR입니다.");
    }
    if (code === "GITHUB_RATE_LIMITED") {
      return jsonError(429, "GITHUB_RATE_LIMITED", "GitHub API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    }
    return jsonError(500, code, "PR 정보를 불러오지 못했습니다.");
  }
}
