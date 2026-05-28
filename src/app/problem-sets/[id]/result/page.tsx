"use client";

import React, { use, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Check,
  X,
  LogIn,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
  FileCode,
  ClipboardCheck,
  GitPullRequest,
  BookCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { QuestionTag, SubmissionResult } from "@/lib/types";

const TAG_LABELS: Record<QuestionTag, string> = {
  CODE_BEHAVIOR: "Code Behavior",
  DATA_FLOW: "Data Flow",
  STATE_CHANGE: "State Change",
  SIDE_EFFECT: "Side Effect",
  ERROR_HANDLING: "Error Handling",
  API_CONTRACT: "API Contract",
  TEST_INTENT: "Test Intent",
  LOGIC_ERROR: "Logic Error",
  STRUCTURAL_CHANGE: "Structural Change",
  CONFIG_CHANGE: "Config Change",
};

function scoreColor(score: number) {
  if (score === 100) return "text-emerald-600";
  if (score === 67) return "text-amber-600";
  return "text-rose-500";
}

function scoreLabel(score: number) {
  if (score === 100) return "완벽해요!";
  if (score === 67) return "잘했어요!";
  return "계속 도전해봐요!";
}

function subscribeSessionStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerAnswersSnapshot() {
  return "";
}

export default function ProblemSetResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const storedResult = useSyncExternalStore(
    subscribeSessionStorage,
    () => sessionStorage.getItem(`result-${id}`) ?? "",
    getServerAnswersSnapshot
  );

  const result = useMemo<SubmissionResult | null>(() => {
    if (!storedResult) return null;

    try {
      return JSON.parse(storedResult) as SubmissionResult;
    } catch {
      return null;
    }
  }, [storedResult]);

  const problemSet = result?.problemSet;

  if (!problemSet) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <SiteHeader activePath="/problem-sets" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-24">
            <p className="text-lg font-bold text-text mb-2">
              문제 세트를 찾을 수 없습니다.
            </p>
            <Link
              href="/problem-sets"
              className="text-sm text-accent hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { questions } = problemSet;
  const score = result.score;

  const techTags = [
    ...problemSet.languageTags,
    ...problemSet.frameworkTags,
    ...problemSet.libraryTags,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/problem-sets" />

      <main className="flex-grow">
        <div className="max-w-[1248px] mx-auto px-6 pt-10 pb-12">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardCheck className="w-6 h-6 text-accent" />
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text">
                풀이 결과
              </h1>
            </div>
            <p className="text-base md:text-lg text-muted-text leading-relaxed mb-10">
              {problemSet.displayTitle}
            </p>

            {/* Two-col: left = score + tags, right = PR */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8 items-start">
              {/* Left */}
              <div className="flex flex-col gap-8">
                {/* Score */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-7xl font-extrabold tabular-nums ${scoreColor(score)}`}>
                      {score}
                    </span>
                    <span className="text-2xl font-bold text-muted-text/60">/ 100</span>
                  </div>
                  <p className={`text-lg font-bold mt-2 ${scoreColor(score)}`}>
                    {scoreLabel(score)}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-text mb-2">문제 유형</p>
                    <div className="flex flex-wrap gap-1.5">
                      {problemSet.questionTypeTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent"
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {techTags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-text mb-2">기술 스택</p>
                      <div className="flex flex-wrap gap-1.5">
                        {techTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: PR info */}
              <div>
                <div className="rounded-xl border border-lavender-tint bg-white p-4 mb-3 shadow-default">
                  <div className="flex min-w-0 items-center gap-2 mb-2">
                    <GitPullRequest className="w-4 h-4 shrink-0 text-accent" />
                    <p className="truncate font-mono text-[11px] font-bold text-accent">
                      {problemSet.repository} #{problemSet.pullNumber}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text leading-relaxed">
                    {problemSet.prTitle}
                  </p>
                </div>
                <a
                  href={problemSet.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-lavender-tint px-4 text-sm font-semibold text-accent transition-all hover:border-accent hover:bg-lavender-tint/20 active:scale-[0.98]"
                >
                  PR 보기
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const answer = result.answers.find((item) => item.questionId === q.id);
              const selected = answer?.selectedAnswer;
              const isCorrect = Boolean(answer?.isCorrect);

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border shadow-default overflow-hidden ${
                    isCorrect ? "border-emerald-200" : "border-rose-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left: question + options */}
                    <div className="flex-1 p-6 md:p-7 border-b md:border-b-0 md:border-r border-lavender-tint/60">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              isCorrect
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-rose-100 text-rose-500"
                            }`}
                          >
                            {isCorrect ? (
                              <Check className="w-3 h-3 stroke-[3px]" />
                            ) : (
                              <X className="w-3 h-3 stroke-[3px]" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-muted-text">Q{i + 1}</span>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                            {TAG_LABELS[q.tag]}
                          </span>
                        </div>
                        <p className="text-base font-bold text-text leading-relaxed">
                          {q.question}
                        </p>
                      </div>

                      {/* Options result */}
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isAnswer = opt.id === answer?.correctAnswer;
                          const isUserSelect = opt.id === selected;
                          let cls =
                            "border-lavender-tint text-muted-text bg-background";
                          if (isAnswer)
                            cls = "border-emerald-300 bg-emerald-50 text-emerald-800";
                          if (isUserSelect && !isCorrect)
                            cls = "border-rose-300 bg-rose-50 text-rose-700";

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-3 px-3.5 py-3 rounded-lg border text-sm ${cls}`}
                            >
                              <span className="font-bold shrink-0">
                                {opt.id}.
                              </span>
                              <span className="leading-relaxed">
                                {opt.text}
                              </span>
                              {isAnswer && (
                                <span className="ml-auto shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  정답
                                </span>
                              )}
                              {isUserSelect && !isCorrect && (
                                <span className="ml-auto shrink-0 text-[10px] font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded">
                                  내 답
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: explanation + files */}
                    <div className="md:w-80 xl:w-96 p-6 md:p-7 bg-background/50">
                      <p className="text-[11px] font-bold text-muted-text uppercase tracking-wide mb-2">
                        해설
                      </p>
                      <p className="text-sm text-text leading-relaxed mb-5">
                        {answer?.explanation ?? q.explanation}
                      </p>

                      {q.relatedFiles.length > 0 && (
                        <>
                          <p className="text-[11px] font-bold text-muted-text uppercase tracking-wide mb-2">
                            관련 파일
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.relatedFiles.map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded border border-lavender-tint bg-white text-muted-text"
                              >
                                <FileCode className="w-3 h-3 shrink-0" />
                                {f.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {result.saved ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <BookCheck className="w-4 h-4 shrink-0" />
                <span className="font-medium">풀이 기록이 저장되었습니다.</span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-text mb-0.5">이 기록을 저장하고 싶으신가요?</p>
                <p className="text-sm text-muted-text">로그인하면 풀이 기록을 저장하고 언제든 다시 볼 수 있습니다.</p>
              </div>
            )}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/problem-sets"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-lavender-tint text-muted-text rounded-lg hover:border-accent hover:text-accent hover:bg-lavender-tint/20 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </Link>
              <Link
                href={`/problem-sets/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-lavender-tint text-accent rounded-lg hover:border-accent hover:bg-lavender-tint/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                다시 풀기
              </Link>
              {!result.saved && (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-lg shadow-sm hover:bg-primary hover:shadow-default transition-all active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  로그인하여 저장
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
