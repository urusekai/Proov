"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LogIn,
  ArrowUpDown,
  Clock,
  ChevronRight,
  History,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { mockSubmissions } from "@/data/mock-history";

type SortOption = "date" | "score-desc" | "score-asc";

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

function ScoreBadge({ score }: { score: number }) {
  const color =
    score === 100
      ? "bg-emerald-50 text-emerald-700"
      : score >= 67
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${color}`}
    >
      {score}점
    </span>
  );
}

export default function HistoryPage() {
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const sorted = useMemo(() => {
    const list = [...mockSubmissions];
    if (sortBy === "date") {
      return list.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }
    if (sortBy === "score-desc") return list.sort((a, b) => b.score - a.score);
    return list.sort((a, b) => a.score - b.score);
  }, [sortBy]);

  const totalCount = mockSubmissions.length;
  const avgScore = Math.round(
    mockSubmissions.reduce((acc, s) => acc + s.score, 0) / totalCount
  );
  const bestScore = Math.max(...mockSubmissions.map((s) => s.score));

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/history" />

      {/* Login banner */}
      <div className="bg-accent/5 border-b border-accent/20">
        <div className="max-w-[1248px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogIn className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm text-text">
              <span className="font-semibold">지금은 샘플 기록을 표시하고 있습니다.</span>{" "}
              <span className="text-muted-text">
                로그인하면 내 실제 풀이 기록을 저장하고 확인할 수 있습니다.
              </span>
            </p>
          </div>
          <Link
            href="/auth/login"
            className="shrink-0 text-sm font-semibold text-accent hover:text-primary transition-colors whitespace-nowrap"
          >
            로그인 →
          </Link>
        </div>
      </div>

      <main className="flex-grow">
        {/* Page Header */}
        <div className="border-b border-lavender-tint/60 bg-background">
          <div className="max-w-[1248px] mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-3">
              <History className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Practice History
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text mb-6">
              풀이 기록
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-4">
                <p className="text-xs text-muted-text mb-1">총 풀이</p>
                <p className="text-2xl font-extrabold text-text">
                  {totalCount}
                  <span className="text-sm font-normal text-muted-text ml-1">
                    개
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-4">
                <p className="text-xs text-muted-text mb-1">평균 점수</p>
                <p className="text-2xl font-extrabold text-text">
                  {avgScore}
                  <span className="text-sm font-normal text-muted-text ml-1">
                    점
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-4">
                <p className="text-xs text-muted-text mb-1">최고 점수</p>
                <p className="text-2xl font-extrabold text-emerald-600">
                  {bestScore}
                  <span className="text-sm font-normal text-muted-text ml-1">
                    점
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-[1248px] mx-auto px-6 py-8">
          {/* Sort controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-text">{totalCount}개의 기록</p>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-text" />
              <div className="flex gap-1">
                {(
                  [
                    { value: "date", label: "최신순" },
                    { value: "score-desc", label: "높은 점수" },
                    { value: "score-asc", label: "낮은 점수" },
                  ] as { value: SortOption; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      sortBy === opt.value
                        ? "bg-accent text-white"
                        : "bg-white border border-lavender-tint text-muted-text hover:border-accent hover:text-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background border-b border-lavender-tint text-[11px] font-bold text-muted-text tracking-wider uppercase">
                    <th className="px-5 py-3.5">제목</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">
                      Repository
                    </th>
                    <th className="px-5 py-3.5 hidden md:table-cell">
                      난이도
                    </th>
                    <th className="px-5 py-3.5">점수</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 날짜
                      </div>
                    </th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-lavender-tint/60 text-sm">
                  {sorted.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-background/60 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-text">
                          {sub.displayTitle}
                        </p>
                        <p className="text-xs text-muted-text sm:hidden mt-0.5 font-mono">
                          {sub.repository}
                        </p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="font-mono text-xs text-accent">
                          {sub.repository}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            DIFFICULTY_STYLE[sub.difficulty]
                          }`}
                        >
                          {DIFFICULTY_LABEL[sub.difficulty]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={sub.score} />
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-xs text-muted-text">
                          {sub.submittedAt}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/history/${sub.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-text hover:text-accent group-hover:text-accent transition-colors"
                        >
                          상세
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
