import { submissionStoreErrorResponse } from "@/lib/server/submission-errors";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import { dbToDetail } from "@/lib/problem-set-mappers";
import type { SubmissionResult, SubmissionScore } from "@/lib/types";

function toScore(score: number): SubmissionScore {
  if (score >= 100) return 100;
  if (score >= 67) return 67;
  if (score >= 33) return 33;
  return 0;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdmin();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      score,
      correct_count,
      total_count,
      submitted_at,
      problem_sets (*),
      submission_answers (
        question_id,
        selected_answer,
        correct_answer,
        is_correct
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      return submissionStoreErrorResponse(error);
    }
    return jsonError(404, "NOT_FOUND", "풀이 기록을 찾을 수 없습니다.");
  }

  if (!submission) {
    return jsonError(404, "NOT_FOUND", "풀이 기록을 찾을 수 없습니다.");
  }

  const problemSet = Array.isArray(submission.problem_sets)
    ? submission.problem_sets[0]
    : submission.problem_sets;
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("problem_set_id", problemSet.id)
    .order("order_index", { ascending: true });

  if (!questions) {
    return jsonError(500, "QUESTIONS_FETCH_FAILED", "문제를 불러오지 못했습니다.");
  }

  const detail = dbToDetail(problemSet, questions, true);
  const answerMap = new Map(
    (submission.submission_answers ?? []).map((answer) => [answer.question_id, answer])
  );

  const result: SubmissionResult = {
    id: submission.id,
    problemSet: detail,
    score: toScore(submission.score),
    correctCount: submission.correct_count,
    totalCount: submission.total_count,
    submittedAt: submission.submitted_at,
    saved: true,
    answers: detail.questions.filter((question) => answerMap.has(question.id)).map((question) => {
      const answer = answerMap.get(question.id);
      return {
        questionId: question.id,
        selectedAnswer: answer?.selected_answer ?? "A",
        correctAnswer: answer?.correct_answer ?? question.answer ?? "A",
        isCorrect: answer?.is_correct ?? false,
        tag: question.tag,
        difficulty: question.difficulty,
        title: question.title,
        question: question.question,
        options: question.options,
        explanation: question.explanation ?? "",
        relatedFiles: question.relatedFiles,
      };
    }),
  };

  return Response.json({ result });
}
