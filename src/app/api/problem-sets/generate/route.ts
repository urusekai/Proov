import { z } from "zod";
import { generateProblemSetFromPr } from "@/lib/server/ai";
import { collectPullRequest } from "@/lib/server/github";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  prUrl: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "PR URL을 입력해 주세요.");
  }

  try {
    const pr = await collectPullRequest(body.data.prUrl);
    const generated = await generateProblemSetFromPr(pr);
    const supabase = createSupabaseAdmin();

    const { data: problemSet, error: insertError } = await supabase
      .from("problem_sets")
      .insert({
        user_id: user.id,
        source_type: "GENERATED",
        visibility: "PRIVATE",
        display_title: generated.displayTitle,
        summary: generated.summary,
        difficulty: generated.difficulty,
        estimated_minutes: 8,
        language_tags: generated.languageTags,
        framework_tags: generated.frameworkTags,
        library_tags: generated.libraryTags,
        topic_tags: generated.topicTags,
        pr_url: pr.prUrl,
        pr_title: pr.title,
        repository_owner: pr.owner,
        repository_name: pr.repo,
        pull_number: pr.pullNumber,
        base_branch: pr.baseBranch,
        head_branch: pr.headBranch,
        ai_model: process.env.OPENAI_MODEL ?? "gpt-5.4",
        raw_ai_response: { generated, github: { files: pr.files } },
      })
      .select("id")
      .single();

    if (insertError || !problemSet) {
      return jsonError(500, "PROBLEM_SET_SAVE_FAILED", "문제 세트를 저장하지 못했습니다.");
    }

    const { error: questionsError } = await supabase.from("questions").insert(
      generated.questions.map((question, index) => ({
        problem_set_id: problemSet.id,
        type: question.type,
        tag: question.tag,
        question: question.question,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation,
        related_files: question.relatedFiles,
        order_index: index,
      }))
    );

    if (questionsError) {
      return jsonError(500, "QUESTIONS_SAVE_FAILED", "문제를 저장하지 못했습니다.");
    }

    return Response.json({ problemSetId: problemSet.id });
  } catch (error) {
    const code = (error as { code?: string }).code ?? "GENERATE_FAILED";
    if (code === "INSUFFICIENT_DIFF") {
      return jsonError(
        422,
        "INSUFFICIENT_DIFF",
        "이 PR은 변경 내용이 너무 적어 3개의 문제를 만들기 어렵습니다."
      );
    }
    if (code === "INVALID_PR_URL") {
      return jsonError(400, "INVALID_PR_URL", "공개 GitHub Pull Request URL 형식이 아닙니다.");
    }
    return jsonError(500, code, "문제 생성 중 오류가 발생했습니다.");
  }
}
