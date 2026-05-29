"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PrMetaBox } from "@/components/pr-meta-box";

import type { QuestionProgressStatus } from "@/lib/use-question-progress";
import type { ProblemQuestionSummary } from "@/lib/types";
import type { QuestionTag } from "@/data/curated-problem-sets";

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

const PROGRESS_BADGE: Record<
  QuestionProgressStatus,
  { label: string; className: string }
> = {
  untried: {
    label: "안 푼 문제",
    className: "bg-slate-100 text-slate-600",
  },
  attempted: {
    label: "틀린 문제",
    className: "bg-rose-50 text-rose-600",
  },
  solved: {
    label: "맞춘 문제",
    className: "bg-emerald-50 text-emerald-700",
  },
};

type ProblemQuestionCardProps = {
  item: ProblemQuestionSummary;
  progressStatus?: QuestionProgressStatus;
  onDelete?: () => void;
};

export function ProblemQuestionCard({
  item,
  progressStatus = "untried",
  onDelete,
}: ProblemQuestionCardProps) {
  const progressBadge = PROGRESS_BADGE[progressStatus];
  const techTags = [
    ...item.languageTags.map((tag) => ({ kind: "language", tag })),
    ...item.frameworkTags.map((tag) => ({ kind: "framework", tag })),
    ...item.libraryTags.map((tag) => ({ kind: "library", tag })),
  ].filter((item, index, arr) => arr.findIndex((t) => t.tag === item.tag) === index);

  return (
    <div className="group flex h-full flex-col rounded-xl border border-lavender-tint bg-white shadow-default transition-all duration-300 hover:shadow-highlight">
      <div className="flex-1 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${DIFFICULTY_STYLE[item.difficulty]}`}>
            {DIFFICULTY_LABEL[item.difficulty]}
          </span>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
            {TAG_LABELS[item.tag as QuestionTag]}
          </span>
          <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${progressBadge.className}`}>
            {progressBadge.label}
          </span>
        </div>

        <h2 className="mb-4 text-lg font-bold leading-snug text-text">
          {item.title}
        </h2>

        <PrMetaBox
          className="mb-4"
          repository={item.repository}
          pullNumber={item.pullNumber}
          prTitle={item.prTitle}
        />

        <div className="flex flex-wrap gap-1.5">
          {techTags.map(({ kind, tag }) => (
            <span
              key={`${kind}-${tag}`}
              className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pb-6 pt-4">
        {onDelete && (
          <button
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-lavender-tint px-4 text-sm font-semibold text-muted-text transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 active:scale-[0.98]"
          >
            삭제
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <a
            href={item.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-lavender-tint px-4 text-sm font-semibold text-accent transition-all hover:border-accent hover:bg-lavender-tint/20 active:scale-[0.98]"
            onClick={(event) => event.stopPropagation()}
          >
            PR 보기
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            href={`/problem-sets/${item.problemSetId}?question=${encodeURIComponent(item.id)}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
          >
            풀기
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
