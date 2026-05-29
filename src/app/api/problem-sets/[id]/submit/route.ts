import { z } from "zod";
import { curatedToDetail, dbToDetail } from "@/lib/problem-set-mappers";
import { ensureCuratedProblemSetInDb } from "@/lib/server/curated-sync";
import { findSubmissionIdForQuestion } from "@/lib/server/submission-history";
import { submissionStoreErrorResponse } from "@/lib/server/submission-errors";
import { curatedQuestionDbId } from "@/lib/server/stable-id";
import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import type { AnswerId, ProblemSetDetail, SubmissionResult, SubmissionScore } from "@/lib/types";

const requestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.enum(["A", "B", "C", "D"]),
    })
  ),
}).refine((data) => data.answers.length > 0, {
  message: "At least one answer is required.",
});

function toScore(correctCount: number, totalCount: number): SubmissionScore {
  if (totalCount <= 0 || correctCount === 0) return 0;
  const percent = Math.round((correctCount / totalCount) * 100);
  if (percent >= 100) return 100;
  if (percent >= 67) return 67;
  if (percent >= 33) return 33;
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

  const questionMap = new Map(problemSet.questions.map((question) => [question.id, question]));
  const invalidAnswer = body.data.answers.find((answer) => !questionMap.has(answer.questionId));
  if (invalidAnswer) {
    return jsonError(400, "INVALID_QUESTION", "존재하지 않는 문항입니다.");
  }

  const answers = body.data.answers.map((submitted) => {
    const question = questionMap.get(submitted.questionId)!;
    const selectedAnswer = submitted.selectedAnswer as AnswerId;
    const correctAnswer = question.answer as AnswerId;
    return {
      questionId: question.id,
      selectedAnswer,
      correctAnswer,
      isCorrect: selectedAnswer === correctAnswer,
      tag: question.tag,
      difficulty: question.difficulty,
      title: question.title,
      question: question.question,
      options: question.options,
      explanation: question.explanation ?? "",
      relatedFiles: question.relatedFiles,
    };
  });
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalCount = answers.length;
  const score = toScore(correctCount, totalCount);
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

      const answerRows = answers.map((answer) => ({
        question_id: isCurated ? curatedQuestionDbId(answer.questionId) : answer.questionId,
        selected_answer: answer.selectedAnswer,
        correct_answer: answer.correctAnswer,
        is_correct: answer.isCorrect,
      }));

      const existingSubmissionId =
        answers.length === 1
          ? await findSubmissionIdForQuestion(supabase, user.id, answerRows[0].question_id)
          : null;

      if (existingSubmissionId) {
        const { error: updateError } = await supabase
          .from("submissions")
          .update({
            problem_set_id: dbProblemSetId,
            score,
            correct_count: correctCount,
            total_count: totalCount,
            submitted_at: submittedAt,
          })
          .eq("id", existingSubmissionId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        const { error: answersError } = await supabase
          .from("submission_answers")
          .update({
            selected_answer: answerRows[0].selected_answer,
            correct_answer: answerRows[0].correct_answer,
            is_correct: answerRows[0].is_correct,
          })
          .eq("submission_id", existingSubmissionId)
          .eq("question_id", answerRows[0].question_id);

        if (answersError) throw answersError;

        submissionId = existingSubmissionId;
        saved = true;
      } else {
        const { data: submission, error: submissionError } = await supabase
          .from("submissions")
          .insert({
            user_id: user.id,
            problem_set_id: dbProblemSetId,
            score,
            correct_count: correctCount,
            total_count: totalCount,
            submitted_at: submittedAt,
          })
          .select("id")
          .single();

        if (submissionError) {
          throw submissionError;
        }

        if (submission) {
          const { error: answersError } = await supabase.from("submission_answers").insert(
            answerRows.map((row) => ({
              submission_id: submission.id,
              ...row,
            }))
          );

          if (answersError) {
            throw answersError;
          }

          submissionId = submission.id;
          saved = true;
        }
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
    totalCount,
    submittedAt,
    saved,
    answers,
  };

  return Response.json({ result });
}
