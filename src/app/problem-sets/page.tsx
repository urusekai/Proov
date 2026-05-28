"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, ChevronDown, BookOpen, ArrowRight, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
        {/* Page Header */}
        <div className="border-b border-lavender-tint/60 bg-background">
          <div className="max-w-[1248px] mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Curated Problem Sets
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text mb-3">
              문제 세트
            </h1>
            <p className="text-base text-muted-text max-w-xl">
              실제 오픈소스 PR에서 엄선한 문제 세트입니다. 학습 주제와 PR 메타데이터를 함께 확인하고 바로 풀어볼 수 있습니다.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-lavender-tint/60 bg-white sticky top-16 z-40">
          <div className="max-w-[1248px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
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

            <span className="text-xs text-muted-text pl-1">
              {filtered.length}개
            </span>
          </div>
        </div>

        {/* Problem Set Grid */}
        <div className="max-w-[1248px] mx-auto px-6 py-10">
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
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((set) => (
                <ProblemSetCard key={set.id} set={set} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-text bg-background border border-lavender-tint rounded-lg cursor-pointer hover:border-accent focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text pointer-events-none" />
    </div>
  );
}

function ProblemSetCard({
  set,
}: {
  set: (typeof publicProblemSetSummaries)[number];
}) {
  const allTags = [
    ...set.languageTags.map((tag) => ({ kind: "language", tag })),
    ...set.frameworkTags.map((tag) => ({ kind: "framework", tag })),
    ...set.libraryTags.map((tag) => ({ kind: "library", tag })),
  ];

  return (
    <div className="group bg-white rounded-xl border border-lavender-tint shadow-default hover:shadow-highlight transition-all duration-200 flex flex-col">
      <div className="p-6 flex-grow">
        {/* Top row: difficulty + time */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              DIFFICULTY_STYLE[set.difficulty]
            }`}
          >
            {DIFFICULTY_LABEL[set.difficulty]}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-text">
            <Clock className="w-3.5 h-3.5" />
            {set.estimatedMinutes}분
          </span>
          <span className="ml-auto font-mono text-xs text-muted-text">
            {set.repository}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[17px] font-bold text-text leading-snug mb-2 group-hover:text-accent transition-colors">
          {set.displayTitle}
        </h2>

        {/* Summary */}
        <p className="text-sm text-muted-text leading-relaxed mb-5">
          {set.summary}
        </p>

        <div className="mb-5 rounded-lg border border-lavender-tint bg-background/60 p-3">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="font-mono text-[11px] font-bold text-accent">
              {set.repository} #{set.pullNumber}
            </p>
            <a
              href={set.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-text hover:text-accent transition-colors"
              onClick={(event) => event.stopPropagation()}
            >
              PR
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs font-medium text-text leading-relaxed line-clamp-2">
            {set.sourcePrTitle}
          </p>
        </div>

        {/* Set tags (language/framework) */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allTags.map(({ kind, tag }) => (
              <span
                key={`${kind}-${tag}`}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-background text-muted-text border border-lavender-tint"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Question type tags */}
        <div className="flex flex-wrap gap-1.5">
          {set.primaryTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold px-2 py-0.5 rounded bg-lavender-tint text-primary"
            >
              {TAG_LABELS[tag as QuestionTag]}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 pb-5 pt-3 border-t border-lavender-tint/60 flex items-center justify-between">
        <span className="text-xs text-muted-text">
          {set.questionCount}문항 · 객관식
        </span>
        <Link
          href={`/problem-sets/${set.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent hover:bg-primary px-4 py-2 rounded-lg transition-all active:scale-[0.98]"
        >
          풀기
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
