"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FilterSelect } from "@/components/filter-select";
import { ProblemQuestionCard } from "@/components/problem-question-card";
import { useQuestionProgress } from "@/lib/use-question-progress";
import type { ProblemQuestionSummary } from "@/lib/types";

type SortOption = "latest" | "oldest" | "popular-desc" | "popular-asc";
type ProgressFilter = "ALL" | "untried" | "attempted" | "solved";


export default function ProblemSetsPage() {
  const [questions, setQuestions] = useState<ProblemQuestionSummary[] | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterLanguage, setFilterLanguage] = useState<string>("ALL");
  const [filterFramework, setFilterFramework] = useState<string>("ALL");
  const [filterProgress, setFilterProgress] = useState<ProgressFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const questionProgress = useQuestionProgress({ refreshOnMount: true });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/problem-sets")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: ProblemQuestionSummary[] }) => {
        if (!cancelled) setQuestions(data.items);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allLanguages = useMemo(
    () => Array.from(new Set((questions ?? []).flatMap((s) => s.languageTags))).sort(),
    [questions]
  );
  const allFrameworks = useMemo(
    () => Array.from(new Set((questions ?? []).flatMap((s) => s.frameworkTags))).sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    let list = [...(questions ?? [])];

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

    if (filterProgress !== "ALL") {
      list = list.filter(
        (s) => (questionProgress.get(s.id) ?? "untried") === filterProgress
      );
    }

    if (sortBy === "latest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "popular-desc") {
      list.sort((a, b) => b.submissionCount - a.submissionCount);
    } else if (sortBy === "popular-asc") {
      list.sort((a, b) => a.submissionCount - b.submissionCount);
    }

    return list;
  }, [questions, filterDifficulty, filterLanguage, filterFramework, filterProgress, sortBy, questionProgress]);

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
              실제 오픈소스 PR에서 뽑은 코드 이해 문제입니다.
              <br />
              문제별 난이도와 유형을 보고 한 문항씩 가볍게 풀어볼 수 있습니다.
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
                { value: "BEGINNER", label: "쉬움" },
                { value: "INTERMEDIATE", label: "보통" },
                { value: "ADVANCED", label: "어려움" },
              ]}
            />

            {/* Language filter */}
            <FilterSelect
              label="언어"
              value={filterLanguage}
              onChange={setFilterLanguage}
              options={[
                { value: "ALL", label: "전체 언어" },
                  ...allLanguages.map((l) => ({ value: l, label: l })),
              ]}
            />

            {/* Framework filter */}
            <FilterSelect
              label="프레임워크"
              value={filterFramework}
              onChange={setFilterFramework}
              options={[
                { value: "ALL", label: "전체 프레임워크" },
                ...allFrameworks.map((f) => ({ value: f, label: f })),
              ]}
            />

            {/* Progress filter */}
            <FilterSelect
              label="풀이 상태"
              value={filterProgress}
              onChange={(v) => setFilterProgress(v as ProgressFilter)}
              options={[
                { value: "ALL", label: "전체 문제" },
                { value: "untried", label: "안 푼 문제" },
                { value: "attempted", label: "틀린 문제" },
                { value: "solved", label: "맞춘 문제" },
              ]}
            />

            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-text tabular-nums">
                {filtered.length}문제
              </span>
              <FilterSelect
                label="정렬"
                value={sortBy}
                onChange={(v) => setSortBy(v as SortOption)}
                options={[
                  { value: "latest", label: "최신순" },
                  { value: "oldest", label: "오래된 순" },
                  { value: "popular-desc", label: "인기 높은 순" },
                  { value: "popular-asc", label: "인기 낮은 순" },
                ]}
              />
            </div>

          </div>

          <div>
            {questions === null ? (
              <div className="grid md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-lavender-tint bg-white shadow-default p-6 animate-pulse"
                  >
                    <div className="mb-3 flex gap-2">
                      <div className="h-6 w-12 rounded-full bg-lavender-tint" />
                      <div className="h-6 w-16 rounded-full bg-lavender-tint" />
                      <div className="ml-auto h-6 w-14 rounded-full bg-lavender-tint" />
                    </div>
                    <div className="mb-4 h-5 w-3/4 rounded bg-lavender-tint" />
                    <div className="mb-1 h-4 w-full rounded bg-lavender-tint/60" />
                    <div className="h-4 w-2/3 rounded bg-lavender-tint/60" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-lavender-tint/50 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-muted-text/60" />
                </div>
                <p className="text-base font-semibold text-text mb-1">
                  조건에 맞는 문제가 없습니다
                </p>
                <p className="text-sm text-muted-text">
                  필터를 변경해 다시 검색해보세요.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filtered.map((set) => (
                  <ProblemQuestionCard
                    key={set.id}
                    item={set}
                    progressStatus={questionProgress.get(set.id) ?? "untried"}
                  />
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
