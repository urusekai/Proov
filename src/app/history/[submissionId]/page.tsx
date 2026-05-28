"use client";

import React, { use, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  ArrowLeft,
  ExternalLink,
  FileCode,
  RotateCcw,
  ClipboardCheck,
  GitPullRequest,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { mockSubmissions } from "@/data/mock-history";
import { curatedProblemSets, QuestionTag } from "@/data/curated-problem-sets";
import { getMockSession, subscribeMockAuth } from "@/lib/mock-auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function getAuthSnapshot(): AuthStatus {
  return getMockSession() ? "authenticated" : "unauthenticated";
}
function getServerAuthSnapshot(): AuthStatus {
  return "checking";
}

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

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

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const router = useRouter();
  const { submissionId } = use(params);

  const authStatus = useSyncExternalStore(subscribeMockAuth, getAuthSnapshot, getServerAuthSnapshot);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace(`/auth/login?redirect=/history/${submissionId}`);
    }
  }, [authStatus, router, submissionId]);

  const submission = mockSubmissions.find((s) => s.id === submissionId);
  const problemSet = submission
    ? curatedProblemSets.find((s) => s.id === submission.problemSetId)
    : undefined;

  if (authStatus === "checking" || authStatus === "unauthenticated") return null;

  if (!submission || !problemSet) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <SiteHeader activePath="/history" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-24">
            <p className="text-lg font-bold text-text mb-2">
              기록을 찾을 수 없습니다.
            </p>
            <Link href="/history" className="text-sm text-accent hover:underline">
              내 기록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // questionId → selected 답변 맵
  const answerMap = Object.fromEntries(
    submission.answers.map((a) => [a.questionId, a.selected])
  );

  const techTags = [
    ...problemSet.languageTags,
    ...problemSet.frameworkTags,
    ...problemSet.libraryTags,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/history" />

      <main className="flex-grow">
        <div className="max-w-[1248px] mx-auto px-6 pt-10 pb-12">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardCheck className="w-6 h-6 text-accent" />
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text">
                풀이 결과
              </h1>
            </div>
            <p className="text-base md:text-lg text-muted-text leading-relaxed mb-2">{problemSet.displayTitle}</p>
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  DIFFICULTY_STYLE[submission.difficulty]
                }`}
              >
                {DIFFICULTY_LABEL[submission.difficulty]}
              </span>
              <span className="text-xs text-muted-text">{formatDate(submission.submittedAt)}</span>
            </div>

            {/* Two-col: left = score + tags, right = PR */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8 items-start">
              {/* Left */}
              <div className="flex flex-col gap-8">
                {/* Score */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-7xl font-extrabold tabular-nums ${scoreColor(submission.score)}`}>
                      {submission.score}
                    </span>
                    <span className="text-2xl font-bold text-muted-text/60">/ 100</span>
                  </div>
                  <p className={`text-lg font-bold mt-2 ${scoreColor(submission.score)}`}>
                    {scoreLabel(submission.score)}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-text mb-2">문제 유형</p>
                    <div className="flex flex-wrap gap-1.5">
                      {problemSet.primaryTags.map((tag) => (
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
                    {problemSet.sourcePrTitle}
                  </p>
                </div>
                <a
                  href={problemSet.sourceUrl}
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
            {problemSet.questions.map((q, i) => {
              const selected = answerMap[q.id];
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

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isAnswer = opt.id === q.answer;
                          const isUserSelect = opt.id === selected;
                          let cls = "border-lavender-tint text-muted-text bg-background";
                          if (isAnswer) cls = "border-emerald-300 bg-emerald-50 text-emerald-800";
                          if (isUserSelect && !isCorrect) cls = "border-rose-300 bg-rose-50 text-rose-700";

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-3 px-3.5 py-3 rounded-lg border text-sm ${cls}`}
                            >
                              <span className="font-bold shrink-0">{opt.id}.</span>
                              <span className="leading-relaxed">{opt.text}</span>
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
                        {q.explanation}
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
          <div className="mt-8 flex items-center justify-end gap-2.5">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-lavender-tint text-muted-text rounded-lg hover:border-accent hover:text-accent hover:bg-lavender-tint/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </Link>
            <Link
              href={`/problem-sets/${submission.problemSetId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-lg shadow-sm hover:bg-primary hover:shadow-default transition-all active:scale-[0.98]"
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
