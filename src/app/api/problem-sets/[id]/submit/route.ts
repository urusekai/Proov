import { z } from "zod";
import { curatedToDetail, dbToDetail } from "@/lib/problem-set-mappers";
import { ensureCuratedProblemSetInDb } from "@/lib/server/curated-sync";
import { submissionStoreErrorResponse } from "@/lib/server/submission-errors";
import { curatedQuestionDbId } from "@/lib/server/stable-id";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import type { AnswerId, ProblemSetDetail, SubmissionResult } from "@/lib/types";

const requestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.enum(["A", "B", "C", "D"]),
    })
  ),
});

function toScore(correctCount: number): 0 | 33 | 67 | 100 {
  if (correctCount === 3) return 100;
  if (correctCount === 2) return 67;
  if (correctCount === 1) return 33;
  return 0;
}

async function loadProblemSetWithAnswers(request: Request, id: string): Promise<ProblemSetDetail | null> {
  const curated = curatedToDetail(id, true);
  if (curated) return curated;
  if (!hasSupabaseServerEnv()) return null;

  const supabase = createSupabaseAdmin();
  const { data: problemSet } = await supabase.from("problem_sets").select("*").eq("id", id).single();
  if (!problemSet) return null;

  if (problemSet.visibility !== "PUBLIC") {
    const user = await getAuthenticatedUser(request);
    if (!user || problemSet.user_id !== user.id) return null;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("problem_set_id", id)
    .order("order_index", { ascending: true });

  if (!questions) return null;
  return dbToDetail(problemSet, questions, true);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "INVALID_REQUEST", "답안 형식이 올바르지 않습니다.");
  }

  const problemSet = await loadProblemSetWithAnswers(request, id);
  if (!problemSet) {
    return jsonError(404, "NOT_FOUND", "문제 세트를 찾을 수 없습니다.");
  }

  const answerMap = new Map(body.data.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  if (problemSet.questions.some((question) => !answerMap.has(question.id))) {
    return jsonError(400, "INCOMPLETE_ANSWERS", "모든 문항에 답해 주세요.");
  }

  const answers = problemSet.questions.map((question) => {
    const selectedAnswer = answerMap.get(question.id) as AnswerId;
    const correctAnswer = question.answer as AnswerId;
    return {
      questionId: question.id,
      selectedAnswer,
      correctAnswer,
      isCorrect: selectedAnswer === correctAnswer,
      tag: question.tag,
      question: question.question,
      options: question.options,
      explanation: question.explanation ?? "",
      relatedFiles: question.relatedFiles,
    };
  });
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const score = toScore(correctCount);
  const submittedAt = new Date().toISOString();
  let submissionId: string | null = null;
  let saved = false;

  const user = await getAuthenticatedUser(request);
  const isCurated = Boolean(curatedToDetail(id, false));

  if (user && hasSupabaseServerEnv()) {
    try {
      const supabase = createSupabaseAdmin();
      let dbProblemSetId = problemSet.id;

      if (isCurated) {
        const syncedId = await ensureCuratedProblemSetInDb(supabase, id);
        if (!syncedId) {
          throw Object.assign(new Error("Curated problem set not found."), { code: "CURATED_NOT_FOUND" });
        }
        dbProblemSetId = syncedId;
      }

      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          problem_set_id: dbProblemSetId,
          score,
          correct_count: correctCount,
          total_count: problemSet.questions.length,
        })
        .select("id")
        .single();

      if (submissionError) {
        throw submissionError;
      }

      if (submission) {
        const { error: answersError } = await supabase.from("submission_answers").insert(
          answers.map((answer) => ({
            submission_id: submission.id,
            question_id: isCurated ? curatedQuestionDbId(answer.questionId) : answer.questionId,
            selected_answer: answer.selectedAnswer,
            correct_answer: answer.correctAnswer,
            is_correct: answer.isCorrect,
          }))
        );

        if (answersError) {
          throw answersError;
        }

        submissionId = submission.id;
        saved = true;
      }
    } catch (storeError) {
      const code = (storeError as { code?: string }).code;
      if (code === "PGRST205") {
        return submissionStoreErrorResponse(storeError as { code?: string; message?: string });
      }
    }
  }

  const result: SubmissionResult = {
    id: submissionId,
    problemSet,
    score,
    correctCount,
    totalCount: problemSet.questions.length,
    submittedAt,
    saved,
    answers,
  };

  return Response.json({ result });
}
