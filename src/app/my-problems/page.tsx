"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, X } from "lucide-react";
import { PrMetaBox } from "@/components/pr-meta-box";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemQuestionCard } from "@/components/problem-question-card";
import { apiFetch } from "@/lib/supabase";
import { useRequireAuth } from "@/components/auth-provider";
import { useQuestionProgress } from "@/lib/use-question-progress";
import { siteContentClass } from "@/lib/layout";
import type { MyProblemSetItem } from "@/app/api/my-problem-sets/route";
import type { ProblemQuestionSummary } from "@/lib/types";

function flattenToQuestions(items: MyProblemSetItem[]): ProblemQuestionSummary[] {
  return items.flatMap((set) =>
    set.questions.map((q) => ({
      id: q.id,
      problemSetId: set.id,
      sourceType: set.sourceType,
      visibility: set.visibility,
      displayTitle: set.displayTitle,
      title: q.title,
      question: q.question,
      tag: q.tag,
      difficulty: q.difficulty,
      estimatedMinutes: set.estimatedMinutes,
      languageTags: set.languageTags,
      frameworkTags: set.frameworkTags,
      libraryTags: set.libraryTags,
      topicTags: set.topicTags,
      repository: set.repository,
      repositoryOwner: set.repositoryOwner,
      repositoryName: set.repositoryName,
      pullNumber: set.pullNumber,
      prUrl: set.prUrl,
      prTitle: set.prTitle,
      sourcePatchUrl: set.sourcePatchUrl,
      relatedFiles: q.relatedFiles,
      orderIndex: q.orderIndex,
      createdAt: set.createdAt,
      submissionCount: 0,
    }))
  );
}

export default function MyProblemsPage() {
  const [items, setItems] = useState<MyProblemSetItem[] | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isReady } = useRequireAuth("/my-problems");
  const questionProgress = useQuestionProgress({ refreshOnMount: true });

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    apiFetch(`/api/problem-sets/${pendingDeleteId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok || res.status === 204) {
          setItems((prev) => prev ? prev.filter((s) => s.id !== pendingDeleteId) : prev);
        }
      })
      .catch(() => {})
      .finally(() => {
        setPendingDeleteId(null);
        setDeleting(false);
      });
  };

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    apiFetch("/api/my-problem-sets")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: MyProblemSetItem[] }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const questions = useMemo(
    () => (items ? flattenToQuestions(items) : null),
    [items]
  );

  const pendingSet = pendingDeleteId ? items?.find((s) => s.id === pendingDeleteId) : null;

  if (!isReady) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/my-problems" />

      <main className={`flex-grow ${questions !== null && questions.length === 0 ? "flex flex-col" : ""}`}>
        <div className={`${siteContentClass} pt-12 pb-12 ${questions !== null && questions.length === 0 ? "flex-1 flex flex-col" : ""}`}>
          <div className="mb-8">
            <h1 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-text">
              내가 만든 문제
            </h1>
            <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
              내가 생성한 PR 기반 문제 세트입니다.
              <br />
              원하는 문항을 골라 바로 풀어보세요.
            </p>
          </div>

          {questions === null ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-lavender-tint bg-white shadow-default p-6 animate-pulse">
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
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-16 h-16 rounded-full bg-lavender-tint/50 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-muted-text/60" />
              </div>
              <p className="text-base font-semibold text-text mb-1">아직 만든 문제가 없습니다</p>
              <p className="text-sm text-muted-text mb-5">공개 GitHub PR을 입력하면 AI가 문제를 자동 생성합니다.</p>
              <Link
                href="/problem-sets/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-lg hover:bg-primary transition-all"
              >
                <Sparkles className="w-4 h-4" />
                문제 만들기
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {questions.map((q) => (
                <ProblemQuestionCard
                  key={q.id}
                  item={q}
                  progressStatus={questionProgress.get(q.id) ?? "untried"}
                  onDelete={() => setPendingDeleteId(q.problemSetId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {/* 삭제 확인 모달 */}
      {pendingSet && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => !deleting && setPendingDeleteId(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !deleting && setPendingDeleteId(null)}
              disabled={deleting}
              className="absolute right-4 top-4 text-muted-text hover:text-text transition-colors disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-base font-extrabold text-text">문제 세트 삭제</h2>
            </div>

            <p className="mb-4 text-sm text-muted-text leading-relaxed">
              해당 PR로 생성한 다음의 문제들이 모두 지워집니다.
            </p>

            <PrMetaBox
              className="mb-4"
              repository={pendingSet.repository}
              pullNumber={pendingSet.pullNumber}
              prTitle={pendingSet.prTitle}
            />

            <div className="mb-6 space-y-2">
              {pendingSet.questions.map((q, idx) => (
                <div key={q.id} className="flex items-start gap-2.5 rounded-lg border border-lavender-tint bg-background/40 px-3.5 py-3">
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold text-muted-text w-4">{idx + 1}</span>
                  <span className="text-xs font-semibold text-text leading-snug">{q.title}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => !deleting && setPendingDeleteId(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-lavender-tint py-2.5 text-sm font-bold text-muted-text hover:bg-lavender-tint/20 transition-colors disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition-colors active:scale-[0.98] disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
