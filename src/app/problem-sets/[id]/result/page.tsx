"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  LogIn,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
  FileCode,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { curatedProblemSets, QuestionTag } from "@/data/curated-problem-sets";

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
  if (score === 100) return "Perfect!";
  if (score === 67) return "Good";
  return "Keep Going";
}

export default function ProblemSetResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const problemSet = curatedProblemSets.find((s) => s.id === id);

  const [answers] = useState<
    Record<number, "A" | "B" | "C" | "D">
  >(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`answers-${id}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          //
        }
      }
    }
    return {};
  });

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

  const correctCount = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.answer ? 1 : 0);
  }, 0);

  const score =
    correctCount === 3 ? 100 : correctCount === 2 ? 67 : correctCount === 1 ? 33 : 0;

  const tagDistribution = questions.reduce<Record<string, { total: number; correct: number }>>(
    (acc, q, i) => {
      const label = TAG_LABELS[q.tag];
      if (!acc[label]) acc[label] = { total: 0, correct: 0 };
      acc[label].total += 1;
      if (answers[i] === q.answer) acc[label].correct += 1;
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/problem-sets" />

      <main className="flex-grow">
        {/* Score Hero */}
        <div className="border-b border-lavender-tint/60 bg-white">
          <div className="max-w-[1248px] mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
              {/* Score */}
              <div className="flex-shrink-0 text-center md:text-left">
                <p className="text-sm font-semibold text-muted-text mb-1 uppercase tracking-wide">
                  최종 점수
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-7xl font-extrabold tabular-nums ${scoreColor(
                      score
                    )}`}
                  >
                    {score}
                  </span>
                  <span className="text-2xl font-bold text-muted-text/60">
                    / 100
                  </span>
                </div>
                <p
                  className={`text-lg font-bold mt-1 ${scoreColor(score)}`}
                >
                  {scoreLabel(score)}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-8 items-center">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-text">
                    {correctCount}
                    <span className="text-xl font-bold text-muted-text/60">
                      /{questions.length}
                    </span>
                  </p>
                  <p className="text-xs text-muted-text mt-1">정답 수</p>
                </div>

                {/* Tag distribution */}
                <div className="hidden sm:flex flex-col gap-1.5">
                  {Object.entries(tagDistribution).map(([label, { total, correct }]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-text w-32 truncate">
                        {label}
                      </span>
                      <span className="text-xs font-bold text-text">
                        {correct}/{total}
                      </span>
                      <div className="w-20 h-1.5 bg-lavender-tint rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(correct / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source info */}
              <div className="md:ml-auto self-start md:self-auto bg-background rounded-xl border border-lavender-tint px-5 py-4 max-w-sm">
                <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
                  출처
                </p>
                <p className="font-mono text-xs text-accent mb-1">
                  {problemSet.repository} #{problemSet.pullNumber}
                </p>
                <p className="text-xs text-text font-medium leading-snug mb-2">
                  {problemSet.sourcePrTitle}
                </p>
                <a
                  href={problemSet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  GitHub에서 보기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="max-w-[1248px] mx-auto px-6 py-10">
          <h2 className="text-lg font-bold text-text mb-6">문항별 결과</h2>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const selected = answers[i];
              const isCorrect = selected === q.answer;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border shadow-default overflow-hidden ${
                    isCorrect ? "border-emerald-200" : "border-rose-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left: question + options */}
                    <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-lavender-tint/60">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-rose-100 text-rose-500"
                          }`}
                        >
                          {isCorrect ? (
                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          ) : (
                            <X className="w-3.5 h-3.5 stroke-[3px]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-muted-text">
                              Q{i + 1}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-lavender-tint text-primary">
                              {TAG_LABELS[q.tag]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-text leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      {/* Options result */}
                      <div className="space-y-1.5 ml-9">
                        {q.options.map((opt) => {
                          const isAnswer = opt.id === q.answer;
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
                              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm ${cls}`}
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
                    <div className="md:w-80 xl:w-96 p-6 bg-background/50">
                      <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
                        해설
                      </p>
                      <p className="text-sm text-text leading-relaxed mb-5">
                        {q.explanation}
                      </p>

                      {q.relatedFiles.length > 0 && (
                        <>
                          <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
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
        </div>

        {/* Save CTA (비로그인) */}
        <div className="border-t border-lavender-tint/60 bg-white">
          <div className="max-w-[1248px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-base font-bold text-text mb-1">
                이 기록을 저장하고 싶으신가요?
              </p>
              <p className="text-sm text-muted-text">
                로그인하면 풀이 기록을 저장하고 언제든 다시 볼 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/problem-sets"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-lavender-tint text-muted-text rounded-lg hover:border-accent hover:text-accent transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </Link>
              <Link
                href={`/problem-sets/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-lavender-tint text-accent rounded-lg hover:border-accent hover:bg-lavender-tint/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                다시 풀기
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-primary transition-all active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                로그인하여 저장
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
