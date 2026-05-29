"use client";

import Link from "next/link";
import {
  BookCheck,
  Check,
  History,
  LogIn,
  RotateCcw,
  X,
} from "lucide-react";

import { ProblemQuestionCard } from "@/components/problem-question-card";
import type { ProblemQuestionSummary, SubmissionResult } from "@/lib/types";
import {
  useQuestionProgress,
  type QuestionProgressStatus,
} from "@/lib/use-question-progress";

type SubmissionResultViewProps = {
  result: SubmissionResult;
};

export function SubmissionResultView({ result }: SubmissionResultViewProps) {
  const questionProgress = useQuestionProgress({ refreshOnMount: true });
  const problemSet = result.problemSet;
  const solvedQuestionIds = new Set(result.answers.map((answer) => answer.questionId));

  const getProgressStatus = (questionId: string): QuestionProgressStatus => {
    const fromHistory = questionProgress.get(questionId);
    if (fromHistory) return fromHistory;

    const justAnswered = result.answers.find((answer) => answer.questionId === questionId);
    if (justAnswered) {
      return justAnswered.isCorrect ? "solved" : "attempted";
    }

    return "untried";
  };
  const nextQuestions: ProblemQuestionSummary[] = problemSet.questions
    .filter((question) => !solvedQuestionIds.has(question.id))
    .slice(0, 2)
    .map((question) => ({
      id: question.id,
      problemSetId: problemSet.id,
      sourceType: problemSet.sourceType,
      visibility: problemSet.visibility,
      displayTitle: problemSet.displayTitle,
      title: question.title,
      question: question.question,
      tag: question.tag,
      difficulty: question.difficulty,
      estimatedMinutes: 3,
      languageTags: problemSet.languageTags,
      frameworkTags: problemSet.frameworkTags,
      libraryTags: problemSet.libraryTags,
      topicTags: problemSet.topicTags,
      repository: problemSet.repository,
      repositoryOwner: problemSet.repositoryOwner,
      repositoryName: problemSet.repositoryName,
      pullNumber: problemSet.pullNumber,
      prUrl: problemSet.prUrl,
      prTitle: problemSet.prTitle,
      sourcePatchUrl: problemSet.sourcePatchUrl,
      relatedFiles: question.relatedFiles,
      orderIndex: question.orderIndex,
      createdAt: problemSet.createdAt,
      submissionCount: 0,
    }));

  const isCorrectResult = result.correctCount === result.totalCount;
  const resultLabel = isCorrectResult ? "정답" : "오답";
  const resultTone = isCorrectResult
    ? {
        text: "text-emerald-700",
        icon: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
        summary: "선택한 답이 정답입니다.",
      }
    : {
        text: "text-rose-600",
        icon: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/80",
        summary: "선택한 답이 정답과 다릅니다.",
      };
  const retryQuestionId = result.answers[0]?.questionId;
  const retryHref = retryQuestionId
    ? `/problem-sets/${problemSet.id}?question=${encodeURIComponent(retryQuestionId)}`
    : `/problem-sets/${problemSet.id}`;

  return (
    <div className="max-w-[1248px] mx-auto px-6 pt-12 pb-12">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl md:text-4xl font-extrabold tracking-tight text-text">
          풀이 결과
        </h1>
        <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
          {result.answers[0]?.title ?? problemSet.displayTitle}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-lavender-tint bg-white shadow-default">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${resultTone.icon}`}
              >
                {isCorrectResult ? (
                  <Check className="h-7 w-7 stroke-[3px]" />
                ) : (
                  <X className="h-7 w-7 stroke-[3px]" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-extrabold tracking-tight md:text-3xl ${resultTone.text}`}>
                  {resultLabel}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-muted-text md:text-base">
                  {resultTone.summary}
                </p>
                {result.totalCount > 1 && (
                  <p className="mt-2 text-sm font-bold tabular-nums text-muted-text">
                    {result.correctCount}개 정답 · {result.totalCount}문항
                  </p>
                )}
              </div>
            </div>

            <div className="flex w-full max-w-full flex-col items-stretch gap-2 sm:ml-auto sm:w-max sm:shrink-0">
              {result.saved ? (
                <div className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-lavender-tint bg-background/60 px-4">
                  <BookCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold text-text">풀이 기록이 저장되었습니다.</p>
                </div>
              ) : (
                <div className="w-full rounded-lg border border-lavender-tint bg-background/60 px-4 py-3">
                  <p className="mb-1 text-sm font-bold text-text">
                    이 기록을 저장하고 싶으신가요?
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-muted-text">
                    로그인하면 풀이 기록을 저장하고 언제든 다시 볼 수 있습니다.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                  >
                    <LogIn className="h-4 w-4" />
                    로그인하여 저장
                  </Link>
                </div>
              )}
              <div className="flex w-full items-center justify-end gap-2">
                <Link
                  href="/history"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-lavender-tint px-4 text-sm font-semibold text-accent transition-all hover:border-accent hover:bg-lavender-tint/20 active:scale-[0.98]"
                >
                  <History className="h-3.5 w-3.5 shrink-0" />
                  내 기록으로
                </Link>
                <Link
                  href={retryHref}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  다시 풀기
                </Link>
              </div>
            </div>
          </div>
        </div>

        {result.answers.map((answer) => {
          const selected = answer.selectedAnswer;
          const isCorrect = answer.isCorrect;

          return (
            <div
              key={answer.questionId}
              className="border-t border-lavender-tint p-6 md:p-8"
            >
              <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                <div className="min-w-0 flex-1">
                  <p className="mb-4 text-base font-bold leading-relaxed text-text">
                    {answer.question}
                  </p>

                  <div className="space-y-2">
                    {answer.options.map((opt) => {
                      const isAnswer = opt.id === answer.correctAnswer;
                      const isUserSelect = opt.id === selected;
                      let cls = "border-lavender-tint text-muted-text bg-background";
                      if (isAnswer)
                        cls = "border-emerald-300 bg-emerald-50 text-emerald-800";
                      if (isUserSelect && !isCorrect)
                        cls = "border-rose-300 bg-rose-50 text-rose-700";

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm ${cls}`}
                        >
                          <span className="shrink-0 font-bold">{opt.id}.</span>
                          <span className="leading-relaxed">{opt.text}</span>
                          {isAnswer && (
                            <span className="ml-auto shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                              정답
                            </span>
                          )}
                          {isUserSelect && !isCorrect && (
                            <span className="ml-auto shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                              내 답
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:w-80 md:shrink-0 xl:w-96">
                  <div className="rounded-xl border border-lavender-tint bg-background/60 p-4 md:p-5">
                    <p className="text-sm leading-relaxed text-text">
                      {answer.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {nextQuestions.length > 0 && (
        <section className="mt-12 md:mt-14">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text">같은 PR의 다른 문제</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {nextQuestions.map((nextQuestion) => (
              <ProblemQuestionCard
                key={nextQuestion.id}
                item={nextQuestion}
                progressStatus={getProgressStatus(nextQuestion.id)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
