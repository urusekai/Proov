"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "쉬움",
  INTERMEDIATE: "보통",
  ADVANCED: "어려움",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED: "bg-rose-50 text-rose-700",
};

function scoreColor(score: number) {
  if (score === 100) return "text-emerald-600";
  if (score >= 67) return "text-amber-600";
  return "text-rose-500";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

type Props = {
  id: string;
  displayTitle: string;
  repository: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  score: 0 | 33 | 67 | 100;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
  isLast?: boolean;
};

export function SubmissionListItem({
  id,
  displayTitle,
  repository,
  difficulty,
  score,
  correctCount,
  totalCount,
  submittedAt,
}: Props) {
  const resultLabel = totalCount === 1 ? (correctCount === 1 ? "정답" : "오답") : `${score}점`;
  return (
    <Link
      href={`/history/${id}`}
      className="flex items-center gap-4 px-6 py-5 hover:bg-background/60 transition-colors group outline-none focus:outline-none focus-visible:bg-background/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/25"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text text-sm leading-snug truncate">{displayTitle}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span className="font-mono text-xs text-accent">{repository}</span>
          <span className="text-xs text-muted-text hidden sm:inline">·</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-block ${DIFFICULTY_STYLE[difficulty]}`}
          >
            {DIFFICULTY_LABEL[difficulty]}
          </span>
          <span className="text-xs text-muted-text hidden sm:inline">·</span>
          <span className="text-xs text-muted-text">{formatDate(submittedAt)}</span>
        </div>
      </div>
      <span className={`text-lg font-extrabold tabular-nums shrink-0 ${scoreColor(score)}`}>
        {resultLabel}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-text group-hover:text-accent transition-colors shrink-0" />
    </Link>
  );
}

export function SubmissionListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-48 bg-lavender-tint/70 rounded animate-pulse" />
        <div className="h-3 w-32 bg-lavender-tint/50 rounded animate-pulse" />
      </div>
      <div className="h-5 w-10 bg-lavender-tint/70 rounded animate-pulse shrink-0" />
    </div>
  );
}
