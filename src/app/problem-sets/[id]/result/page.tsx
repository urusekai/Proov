"use client";

import React, { use, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionResultView } from "@/components/submission-result-view";
import type { SubmissionResult } from "@/lib/types";

function subscribeSessionStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerAnswersSnapshot() {
  return "";
}

export default function ProblemSetResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const storedResult = useSyncExternalStore(
    subscribeSessionStorage,
    () => sessionStorage.getItem(`result-${id}`) ?? "",
    getServerAnswersSnapshot
  );

  const result = useMemo<SubmissionResult | null>(() => {
    if (!storedResult) return null;

    try {
      return JSON.parse(storedResult) as SubmissionResult;
    } catch {
      return null;
    }
  }, [storedResult]);

  if (!result?.problemSet) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <SiteHeader activePath="/problem-sets" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-24">
            <p className="text-lg font-bold text-text mb-2">
              문제 세트를 찾을 수 없습니다.
            </p>
            <Link
              href="/problem-sets"
              className="text-sm text-accent hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/problem-sets" />
      <main className="flex-grow">
        <SubmissionResultView result={result} />
      </main>
      <SiteFooter />
    </div>
  );
}
