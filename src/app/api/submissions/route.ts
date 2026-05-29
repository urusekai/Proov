import { publicQuestionIdFromDbId } from "@/lib/server/curated-question-id";
import { dedupeSubmissionsByQuestion } from "@/lib/server/submission-history";
import { submissionStoreErrorResponse } from "@/lib/server/submission-errors";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import type { SubmissionListItemData, SubmissionScore } from "@/lib/types";

function toScore(score: number): SubmissionScore {
  if (score >= 100) return 100;
  if (score >= 67) return 67;
  if (score >= 33) return 33;
  return 0;
}

export async function GET(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return jsonError(500, "SUPABASE_NOT_CONFIGURED", "Supabase 환경 변수가 필요합니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const supabase = createSupabaseAdmin();
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      score,
      correct_count,
      total_count,
      submitted_at,
      problem_sets (
        id,
        display_title,
        difficulty,
        pr_url,
        pr_title,
        repository_owner,
        repository_name,
        pull_number
      ),
      submission_answers (
        question_id,
        selected_answer,
        correct_answer,
        is_correct,
        questions (
          tag,
          difficulty,
          title,
          question,
          options,
          explanation,
          related_files
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    return submissionStoreErrorResponse(error);
  }

  if (!submissions) {
    return jsonError(500, "SUBMISSIONS_FETCH_FAILED", "풀이 기록을 불러오지 못했습니다.");
  }

  const items: SubmissionListItemData[] = submissions.map((submission) => {
    const problemSet = Array.isArray(submission.problem_sets)
      ? submission.problem_sets[0]
      : submission.problem_sets;
    const answers = (submission.submission_answers ?? []).map((answer) => {
      const question = Array.isArray(answer.questions) ? answer.questions[0] : answer.questions;
      return {
        questionId: publicQuestionIdFromDbId(answer.question_id, problemSet.id),
        selectedAnswer: answer.selected_answer,
        correctAnswer: answer.correct_answer,
        isCorrect: answer.is_correct,
        tag: question.tag,
        difficulty: question.difficulty ?? problemSet.difficulty,
        title: question.title || question.question,
        question: question.question,
        options: question.options,
        explanation: question.explanation,
        relatedFiles: question.related_files ?? [],
      };
    });

    return {
      id: submission.id,
      problemSetId: problemSet.id,
      displayTitle: answers[0]?.title ?? problemSet.display_title,
      repository: `${problemSet.repository_owner}/${problemSet.repository_name}`,
      repositoryOwner: problemSet.repository_owner,
      repositoryName: problemSet.repository_name,
      pullNumber: problemSet.pull_number,
      sourcePrTitle: problemSet.pr_title,
      sourceUrl: problemSet.pr_url,
      difficulty: problemSet.difficulty,
      score: toScore(submission.score),
      correctCount: submission.correct_count,
      totalCount: submission.total_count,
      submittedAt: submission.submitted_at,
      answers,
    };
  });

  return Response.json({ items: dedupeSubmissionsByQuestion(items) });
}
