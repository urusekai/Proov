"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { History, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FilterSelect } from "@/components/filter-select";
import type { QuestionTag } from "@/data/curated-problem-sets";
import { apiFetch } from "@/lib/supabase";
import { useRequireAuth } from "@/components/auth-provider";
import { SubmissionListItem, SubmissionListItemSkeleton } from "@/components/submission-list-item";
import type { SubmissionListItemData } from "@/lib/types";

type SortOption = "date-desc" | "date-asc";

const TAG_LABELS: Record<QuestionTag, string> = {
  CODE_BEHAVIOR: "코드 동작",
  DATA_FLOW: "데이터 흐름",
  STATE_CHANGE: "상태 변화",
  ERROR_HANDLING: "에러 처리",
  API_CONTRACT: "API 명세",
  TEST_INTENT: "테스트 의도",
  STRUCTURAL_CHANGE: "구조 변경",
  CONFIG_CHANGE: "설정값",
};

const DIFFICULTY_ITEMS = [
  {
    key: "BEGINNER",
    label: "쉬움",
    barClass: "bg-emerald-400",
    textClass: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "INTERMEDIATE",
    label: "보통",
    barClass: "bg-amber-400",
    textClass: "text-amber-600",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  {
    key: "ADVANCED",
    label: "어려움",
    barClass: "bg-rose-400",
    textClass: "text-rose-500",
    badgeClass: "bg-rose-50 text-rose-700",
  },
] as const;

function getDayNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function countStreak(dateStrings: string[]): number {
  const days = Array.from(new Set(dateStrings.map(getDayNumber))).sort(
    (a, b) => b - a
  );

  if (days.length === 0) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] !== 1) break;
    streak += 1;
  }

  return streak;
}

export default function HistoryPage() {
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [submissions, setSubmissions] = useState<SubmissionListItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isReady } = useRequireAuth("/history");

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    setIsLoading(true);
    apiFetch("/api/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { items: SubmissionListItemData[] }) => {
        if (!cancelled) setSubmissions(data.items);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const sorted = useMemo(() => {
    const list = [...submissions];
    if (sortBy === "date-asc")
      return list.sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    return list.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [submissions, sortBy]);

  const totalCount = submissions.length;
  const totalQuestionCount = totalCount;
  const tagStats = submissions.reduce(
    (acc, submission) => {
      submission.answers.forEach((answer) => {
        const current = acc[answer.tag] ?? { correct: 0, total: 0 };
        acc[answer.tag] = {
          correct: current.correct + (answer.isCorrect ? 1 : 0),
          total: current.total + 1,
        };
      });
      return acc;
    },
    {} as Partial<Record<QuestionTag, { correct: number; total: number }>>
  );
  const rankedTagStats = Object.entries(tagStats)
    .map(([tag, stat]) => ({
      tag: tag as QuestionTag,
      correct: stat.correct,
      total: stat.total,
      rate: stat.total === 0 ? 0 : stat.correct / stat.total,
    }))
    .sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate;
      if (b.total !== a.total) return b.total - a.total;
      return TAG_LABELS[a.tag].localeCompare(TAG_LABELS[b.tag]);
    });
  const strongestTag = rankedTagStats[0] ?? null;
  const weakestTag =
    rankedTagStats.length > 0
      ? [...rankedTagStats].sort((a, b) => {
          if (a.rate !== b.rate) return a.rate - b.rate;
          if (b.total !== a.total) return b.total - a.total;
          return TAG_LABELS[a.tag].localeCompare(TAG_LABELS[b.tag]);
        })[0]
      : null;
  const streakDays = countStreak(
    submissions.map((submission) => submission.submittedAt)
  );
  const difficultyStats = useMemo(() => {
    return submissions.reduce(
      (acc, sub) => {
        const difficulty = sub.answers[0]?.difficulty ?? sub.difficulty;
        acc[difficulty] = (acc[difficulty] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<"BEGINNER" | "INTERMEDIATE" | "ADVANCED", number>>
    );
  }, [submissions]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/history" />

      <main className="flex-grow">
        <div className="max-w-[1248px] mx-auto px-6 pt-12 pb-12">
          <div className="mb-10">
            <div className="mb-8">
              <h1 className="mb-4 text-3xl md:text-4xl font-extrabold tracking-tight text-text">
                내 기록
              </h1>
              <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl whitespace-pre-line">
                {"내가 풀어온 문제의 결과와 유형별 패턴을 확인하세요.\n강점과 약점을 파악해 코드 이해 역량을 꾸준히 키워나갈 수 있습니다."}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-lavender-tint bg-white shadow-default">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold text-muted-text">푼 문제 수</p>
                  <p className="mt-2 text-2xl font-extrabold leading-tight text-text">
                    {isLoading ? "—" : `${totalQuestionCount}문항`}
                  </p>
                </div>

                <div className="border-t border-lavender-tint px-6 py-5 sm:border-l sm:border-t-0">
                  <p className="text-sm font-semibold text-muted-text">강한 유형</p>
                  <p className="mt-2 break-keep text-xl font-extrabold leading-tight text-emerald-600">
                    {isLoading || !strongestTag ? "—" : TAG_LABELS[strongestTag.tag]}
                  </p>
                </div>

                <div className="border-t border-lavender-tint px-6 py-5 lg:border-l lg:border-t-0">
                  <p className="text-sm font-semibold text-muted-text">약한 유형</p>
                  <p className="mt-2 break-keep text-xl font-extrabold leading-tight text-rose-500">
                    {isLoading || !weakestTag ? "—" : TAG_LABELS[weakestTag.tag]}
                  </p>
                </div>

                <div className="border-t border-lavender-tint px-6 py-5 sm:border-l lg:border-t-0">
                  <p className="text-sm font-semibold text-muted-text">연속 풀이일</p>
                  <p className="mt-2 text-2xl font-extrabold leading-tight text-text">
                    {isLoading ? "—" : `${streakDays}일`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 border-t border-lavender-tint lg:grid-cols-4">
                <div className="p-6">
                  <p className="mb-4 text-sm font-extrabold text-text">
                    난이도별 푼 문항
                  </p>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="h-4 w-20 rounded bg-lavender-tint/70 animate-pulse" />
                        <div className="h-2.5 w-full rounded-full bg-lavender-tint/50 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {DIFFICULTY_ITEMS.map(({ key, label, barClass, textClass, badgeClass }) => {
                      const count = difficultyStats[key] ?? 0;
                      const pct = totalCount === 0 ? 0 : Math.round((count / totalCount) * 100);
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{label}</span>
                            <span className={`text-xs font-bold tabular-nums ${count === 0 ? "text-muted-text" : textClass}`}>{count}개</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-lavender-tint overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${count === 0 ? "bg-lavender-tint" : barClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>

                <div className="border-t border-lavender-tint p-6 lg:col-span-3 lg:border-l lg:border-t-0">
                  <p className="mb-4 text-sm font-extrabold text-text">
                    유형별 정답률
                  </p>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-24 rounded-full bg-lavender-tint/70 animate-pulse shrink-0" />
                        <div className="h-2 flex-1 rounded-full bg-lavender-tint/50 animate-pulse" />
                        <div className="h-4 w-8 rounded bg-lavender-tint/60 animate-pulse shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : rankedTagStats.length === 0 ? (
                  <p className="text-sm text-muted-text">풀이 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2.5">
                    {rankedTagStats.map((stat) => {
                      const pct = Math.round(stat.rate * 100);
                      const barColor = pct >= 67 ? "bg-emerald-400" : pct >= 34 ? "bg-amber-400" : "bg-rose-400";
                      const textColor = pct >= 67 ? "text-emerald-600" : pct >= 34 ? "text-amber-600" : "text-rose-500";
                      return (
                        <div key={stat.tag} className="flex items-center gap-3">
                          <span className="shrink-0 w-[120px] text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent truncate text-center">
                            {TAG_LABELS[stat.tag]}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-lavender-tint overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`shrink-0 text-xs font-bold tabular-nums w-10 text-right ${textColor}`}>{pct}%</span>
                          <span className="shrink-0 text-[11px] text-muted-text tabular-nums w-10">{stat.correct}/{stat.total}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex justify-end mb-5">
            <FilterSelect
              label="정렬"
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={[
                { value: "date-desc", label: "최신순" },
                { value: "date-asc", label: "오래된순" },
              ]}
            />
          </div>

          <div className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden">
            {isLoading ? (
              <div className="history-list">
                <SubmissionListItemSkeleton />
                <SubmissionListItemSkeleton />
                <SubmissionListItemSkeleton />
              </div>
            ) : totalCount === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-4">
                  <History className="w-10 h-10 text-lavender-tint" />
                  <div>
                    <p className="text-base font-bold text-text mb-1">아직 풀이 기록이 없습니다</p>
                    <p className="text-sm text-muted-text">문제를 풀면 여기에 기록됩니다.</p>
                  </div>
                  <Link
                    href="/problem-sets"
                    className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-lg hover:bg-primary transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    문제 목록 보기
                  </Link>
                </div>
              </div>
            ) : (
              <div className="history-list">
                {sorted.map((sub) => (
                  <SubmissionListItem key={sub.id} {...sub} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
