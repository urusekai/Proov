"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionResultView } from "@/components/submission-result-view";
import type { SubmissionResult } from "@/lib/types";
import { apiFetch } from "@/lib/supabase";
import { useRequireAuth } from "@/components/auth-provider";

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = use(params);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const { isReady } = useRequireAuth(`/history/${submissionId}`);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    apiFetch(`/api/submissions/${submissionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { result: SubmissionResult }) => {
        if (!cancelled) setResult(data.result);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, submissionId]);

  if (!isReady) return null;

  if (!result) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/history" />
      <main className="flex-grow">
        <SubmissionResultView result={result} />
      </main>
      <SiteFooter />
    </div>
  );
}
