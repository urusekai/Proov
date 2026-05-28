"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, ExternalLink, GitPullRequest } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FilterSelect } from "@/components/filter-select";
import {
  publicProblemSetSummaries,
  QuestionTag,
} from "@/data/curated-problem-sets";

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

type SortOption = "latest" | "difficulty-asc" | "difficulty-desc";

const ALL_LANGUAGES = Array.from(
  new Set(publicProblemSetSummaries.flatMap((s) => s.languageTags))
).sort();

const ALL_FRAMEWORKS = Array.from(
  new Set(publicProblemSetSummaries.flatMap((s) => s.frameworkTags))
).sort();

const DIFFICULTY_ORDER = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };

export default function ProblemSetsPage() {
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterLanguage, setFilterLanguage] = useState<string>("ALL");
  const [filterFramework, setFilterFramework] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const filtered = useMemo(() => {
    let list = [...publicProblemSetSummaries];

    if (filterDifficulty !== "ALL") {
      list = list.filter((s) => s.difficulty === filterDifficulty);
    }
    if (filterLanguage !== "ALL") {
      list = list.filter((s) =>
        (s.languageTags as string[]).includes(filterLanguage)
      );
    }
    if (filterFramework !== "ALL") {
      list = list.filter((s) =>
        (s.frameworkTags as string[]).includes(filterFramework)
      );
    }

    if (sortBy === "difficulty-asc") {
      list.sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
      );
    } else if (sortBy === "difficulty-desc") {
      list.sort(
        (a, b) =>
          DIFFICULTY_ORDER[b.difficulty] - DIFFICULTY_ORDER[a.difficulty]
      );
    }

    return list;
  }, [filterDifficulty, filterLanguage, filterFramework, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/problem-sets" />

      <main className="flex-grow">
        <div className="max-w-[1248px] mx-auto px-6 pt-12 pb-12">
          <div className="mb-8">
            <h1 className="mb-4 text-3xl md:text-4xl font-extrabold tracking-tight text-text">
              문제 목록
            </h1>
            <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
              실제 오픈소스 PR에서 엄선한 문제 세트입니다.
              <br />
              학습 주제와 PR 메타데이터를 함께 확인하고 바로 풀어볼 수 있습니다.
            </p>
          </div>

          <div className="sticky top-16 z-40 -mx-1 mb-8 flex flex-wrap items-center gap-3 bg-background px-1 py-2">
            {/* Difficulty filter */}
            <FilterSelect
              label="난이도"
              value={filterDifficulty}
              onChange={setFilterDifficulty}
              options={[
                { value: "ALL", label: "전체 난이도" },
                { value: "BEGINNER", label: "Beginner" },
                { value: "INTERMEDIATE", label: "Intermediate" },
                { value: "ADVANCED", label: "Advanced" },
              ]}
            />

            {/* Language filter */}
            <FilterSelect
              label="언어"
              value={filterLanguage}
              onChange={setFilterLanguage}
              options={[
                { value: "ALL", label: "전체 언어" },
                ...ALL_LANGUAGES.map((l) => ({ value: l, label: l })),
              ]}
            />

            {/* Framework filter */}
            {ALL_FRAMEWORKS.length > 0 && (
              <FilterSelect
                label="프레임워크"
                value={filterFramework}
                onChange={setFilterFramework}
                options={[
                  { value: "ALL", label: "전체 프레임워크" },
                  ...ALL_FRAMEWORKS.map((f) => ({ value: f, label: f })),
                ]}
              />
            )}

            <div className="ml-auto">
              <FilterSelect
                label="정렬"
                value={sortBy}
                onChange={(v) => setSortBy(v as SortOption)}
                options={[
                  { value: "latest", label: "최신순" },
                  { value: "difficulty-asc", label: "난이도 낮은 순" },
                  { value: "difficulty-desc", label: "난이도 높은 순" },
                ]}
              />
            </div>

          </div>

          <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-lavender-tint/50 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-muted-text/60" />
              </div>
              <p className="text-base font-semibold text-text mb-1">
                조건에 맞는 문제 세트가 없습니다
              </p>
              <p className="text-sm text-muted-text">
                필터를 변경해 다시 검색해보세요.
              </p>
            </div>
          ) : (
            <div className="grid items-start md:grid-cols-2 gap-6">
              {filtered.map((set) => (
                <ProblemSetCard key={set.id} set={set} />
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

function ProblemSetCard({
  set,
}: {
  set: (typeof publicProblemSetSummaries)[number];
}) {
  const techTags = [
    ...set.languageTags.map((tag) => ({ kind: "language", tag })),
    ...set.frameworkTags.map((tag) => ({ kind: "framework", tag })),
    ...set.libraryTags.map((tag) => ({ kind: "library", tag })),
  ];

  return (
    <div className="group bg-white rounded-xl border border-lavender-tint shadow-default hover:shadow-highlight transition-all duration-300 flex flex-col">
      <div className="p-6 md:p-8">
        {/* Top row: difficulty + repository */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              DIFFICULTY_STYLE[set.difficulty]
            }`}
          >
            {DIFFICULTY_LABEL[set.difficulty]}
          </span>
          <span className="ml-auto font-mono text-xs text-accent">
            {set.repository}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-text leading-snug mb-6">
          {set.displayTitle}
        </h2>

        {/* PR info box */}
        <div className="mb-6 rounded-xl border border-lavender-tint bg-background/60 p-4">
          <div className="flex min-w-0 items-center gap-2 mb-2">
            <GitPullRequest className="w-4 h-4 shrink-0 text-accent" />
            <p className="truncate font-mono text-[11px] font-bold text-accent">
              {set.repository} #{set.pullNumber}
            </p>
          </div>
          <p className="text-sm font-semibold text-text leading-relaxed line-clamp-2">
            {set.sourcePrTitle}
          </p>
        </div>

        {/* Tags section */}
        <div className="space-y-3">
          {techTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-text mb-2">
                언어 · 프레임워크
              </p>
              <div className="flex flex-wrap gap-1.5">
                {techTags.map(({ kind, tag }) => (
                  <span
                    key={`${kind}-${tag}`}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {set.primaryTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-text mb-2">
                문제 유형
              </p>
              <div className="flex flex-wrap gap-1.5">
                {set.primaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent"
                  >
                    {TAG_LABELS[tag as QuestionTag]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 md:px-8 pb-6 pt-0 flex items-center justify-end gap-2">
          <a
            href={set.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-lavender-tint px-4 text-sm font-semibold text-accent transition-all hover:border-accent hover:bg-lavender-tint/20 active:scale-[0.98]"
            onClick={(event) => event.stopPropagation()}
          >
            PR 보기
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href={`/problem-sets/${set.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 text-sm font-semibold text-white bg-accent hover:bg-primary px-4 rounded-lg shadow-sm hover:shadow-default transition-all active:scale-[0.98]"
          >
            풀기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
      </div>
    </div>
  );
}
