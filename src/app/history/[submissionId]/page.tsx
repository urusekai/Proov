"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowLeft,
  ExternalLink,
  FileCode,
  RotateCcw,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { mockSubmissions } from "@/data/mock-history";
import { QuestionTag } from "@/data/curated-problem-sets";

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

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED: "bg-rose-50 text-rose-700",
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

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = use(params);
  const submission = mockSubmissions.find((s) => s.id === submissionId);

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <SiteHeader activePath="/history" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-24">
            <p className="text-lg font-bold text-text mb-2">
              기록을 찾을 수 없습니다.
            </p>
            <Link
              href="/history"
              className="text-sm text-accent hover:underline"
            >
              기록 목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/history" />

      <main className="flex-grow">
        {/* Hero */}
        <div className="border-b border-lavender-tint/60 bg-white">
          <div className="max-w-[1248px] mx-auto px-6 py-10">
            {/* Back link */}
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm text-muted-text hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              풀이 기록
            </Link>

            <div className="flex flex-col md:flex-row md:items-end gap-8">
              {/* Score */}
              <div className="shrink-0">
                <p className="text-xs font-semibold text-muted-text uppercase tracking-wide mb-1">
                  최종 점수
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-6xl font-extrabold tabular-nums ${scoreColor(
                      submission.score
                    )}`}
                  >
                    {submission.score}
                  </span>
                  <span className="text-xl font-bold text-muted-text/60">
                    / 100
                  </span>
                </div>
                <p
                  className={`text-base font-bold mt-1 ${scoreColor(
                    submission.score
                  )}`}
                >
                  {scoreLabel(submission.score)}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-text">
                  {submission.displayTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-text">
                  <span className="font-mono text-accent">
                    {submission.repository}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      DIFFICULTY_STYLE[submission.difficulty]
                    }`}
                  >
                    {DIFFICULTY_LABEL[submission.difficulty]}
                  </span>
                  <span>{submission.submittedAt}</span>
                  <span>
                    {submission.correctCount}/{submission.answers.length}문항
                    정답
                  </span>
                </div>
              </div>

              {/* Source Info */}
              <div className="md:ml-auto bg-background rounded-xl border border-lavender-tint px-5 py-4 shrink-0">
                <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
                  출처
                </p>
                <p className="font-mono text-xs text-accent mb-1">
                  {submission.repository} #{submission.pullNumber}
                </p>
                <p className="text-xs text-text font-medium leading-snug mb-2 max-w-xs">
                  {submission.sourcePrTitle}
                </p>
                <a
                  href={submission.sourceUrl}
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

        {/* Question Breakdown */}
        <div className="max-w-[1248px] mx-auto px-6 py-10">
          <h2 className="text-lg font-bold text-text mb-6">문항별 분석</h2>

          <div className="space-y-4">
            {submission.answers.map((ans, i) => (
              <div
                key={ans.questionId}
                className={`bg-white rounded-xl border shadow-default overflow-hidden ${
                  ans.isCorrect ? "border-emerald-200" : "border-rose-200"
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left */}
                  <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-lavender-tint/60">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                          ans.isCorrect
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-500"
                        }`}
                      >
                        {ans.isCorrect ? (
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
                            {TAG_LABELS[ans.tag]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text leading-relaxed">
                          {ans.question}
                        </p>
                      </div>
                    </div>

                    {/* Answer summary */}
                    <div className="ml-9 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-text">내 답변</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-sm ${
                            ans.isCorrect
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {ans.selected}
                        </span>
                      </div>
                      {!ans.isCorrect && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-text">정답</span>
                          <span className="font-bold px-2 py-0.5 rounded text-sm bg-emerald-50 text-emerald-700">
                            {ans.correct}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Explanation */}
                  <div className="md:w-80 xl:w-96 p-6 bg-background/50">
                    <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
                      해설
                    </p>
                    <p className="text-sm text-text leading-relaxed mb-5">
                      {ans.explanation}
                    </p>

                    {ans.relatedFiles.length > 0 && (
                      <>
                        <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wide mb-2">
                          관련 파일
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ans.relatedFiles.map((f) => (
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
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-lavender-tint/60 bg-white">
          <div className="max-w-[1248px] mx-auto px-6 py-8 flex items-center justify-between gap-4">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-lavender-tint text-muted-text rounded-lg hover:border-accent hover:text-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </Link>
            <Link
              href={`/problem-sets/${submission.problemSetId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-primary transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              다시 풀기
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
