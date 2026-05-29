"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Copy, Info, X } from "lucide-react";
import { PrMetaBox } from "@/components/pr-meta-box";
import { formatPrRepository, parseGitHubPrUrl } from "@/lib/github-pr-url";
import { getPrDiffGuidanceItems } from "@/lib/pr-diff-policy";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/supabase";
import { useRequireAuth } from "@/components/auth-provider";
import { siteContentClass } from "@/lib/layout";

const EXAMPLE_PR_URL = "https://github.com/muteLJS/GOREON/pull/102";

const loadingPhases = [
  "Pull Request URL을 확인하고 있습니다.",
  "PR 코드 변경 내용을 불러오고 있습니다.",
  "AI가 코드를 분석하고 있습니다.",
  "객관식 문항을 생성하고 있습니다.",
  "문제 세트를 저장하고 있습니다.",
];

function ProblemSetNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFromQuery = searchParams.get("url");
  const [prUrl, setPrUrl] = useState(urlFromQuery ?? "");
  const [step, setStep] = useState<"INPUT" | "LOADING" | "ERROR">(
    urlFromQuery ? "LOADING" : "INPUT"
  );
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [exampleCopied, setExampleCopied] = useState(false);
  const [prPreview, setPrPreview] = useState<{
    repository: string;
    pullNumber: number;
    prTitle?: string;
  } | null>(null);
  const autoStartedRef = useRef(false);
  const redirectPath =
    "/problem-sets/new" + (urlFromQuery ? `?url=${encodeURIComponent(urlFromQuery)}` : "");
  const { isReady } = useRequireAuth(redirectPath);

  useEffect(() => {
    if (step !== "LOADING") return;

    const interval = window.setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingPhases.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [router, step]);

  useEffect(() => {
    if (step !== "LOADING" || !prUrl.trim()) {
      if (step !== "LOADING") setPrPreview(null);
      return;
    }

    const parsed = parseGitHubPrUrl(prUrl);
    if (!parsed) {
      setPrPreview(null);
      return;
    }

    setPrPreview({
      repository: formatPrRepository(parsed),
      pullNumber: parsed.pullNumber,
    });

    let cancelled = false;
    apiFetch("/api/pr/preview", {
      method: "POST",
      body: JSON.stringify({ prUrl }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          repository?: string;
          pullNumber?: number;
          title?: string;
        };
        if (cancelled || !res.ok) return;
        setPrPreview({
          repository: data.repository ?? formatPrRepository(parsed),
          pullNumber: data.pullNumber ?? parsed.pullNumber,
          prTitle: data.title,
        });
      })
      .catch(() => {
        // URL 파싱 결과만 표시하고 제목은 스켈레톤 유지
      });

    return () => {
      cancelled = true;
    };
  }, [step, prUrl]);

  const startGeneration = () => {
    if (!prUrl.trim()) return;
    setStep("LOADING");
    setLoadingStep(0);
    setErrorMessage("");

    apiFetch("/api/problem-sets/generate", {
      method: "POST",
      body: JSON.stringify({ prUrl }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message ?? "문제 생성에 실패했습니다.");
        }
        return data as { problemSetId: string };
      })
      .then((data) => {
        setLoadingStep(loadingPhases.length - 1);
        window.setTimeout(() => {
          router.push("/my-problems");
        }, 500);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "문제 생성에 실패했습니다.");
        setStep("ERROR");
      });
  };

  const handleStart = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startGeneration();
  };

  const copyExamplePrUrl = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_PR_URL);
      setExampleCopied(true);
      window.setTimeout(() => setExampleCopied(false), 2000);
    } catch {
      setExampleCopied(false);
    }
  };

  useEffect(() => {
    if (!isReady || !urlFromQuery || autoStartedRef.current) return;
    autoStartedRef.current = true;
    window.setTimeout(() => startGeneration(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, urlFromQuery]);

  const prGuidanceItems = getPrDiffGuidanceItems();

  if (!isReady) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent/20">
      <SiteHeader activePath="/problem-sets/new" />

      <main className={`flex-grow ${step === "LOADING" ? "flex items-center" : ""}`}>
        <div className={`${siteContentClass} ${step === "LOADING" ? "w-full py-12" : "pt-12 pb-12"}`}>
          {step === "INPUT" && (
            <>
              <div className="mb-10">
                <h1 className="mb-4 text-3xl md:text-4xl font-extrabold tracking-tight text-text">
                  나만의 문제 만들기
                </h1>
                <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl whitespace-pre-line">
                  {"분석하고 싶은 공개 GitHub Pull Request URL을 입력해주세요.\nAI가 코드 변경의 핵심 의도를 짚는 문제를 자동 출제합니다."}
                </p>
              </div>

              <section aria-labelledby="pr-guidance-heading" className="mb-10 rounded-xl border border-lavender-tint bg-white shadow-default overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-lavender-tint">
                  <Info className="h-4 w-4 text-accent shrink-0" aria-hidden />
                  <h2 id="pr-guidance-heading" className="text-sm font-semibold text-text">
                    PR 입력 전에 확인해 주세요
                  </h2>
                </div>
                <ul className="divide-y divide-lavender-tint">
                  {prGuidanceItems.map((item) => (
                    <li key={item.title} className="px-5 py-4">
                      <p className="text-sm font-semibold text-text mb-0.5 break-keep">{item.title}</p>
                      <p className="text-sm leading-relaxed text-muted-text break-keep">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <form onSubmit={handleStart}>
                <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                  <label htmlFor="pr-url" className="sr-only">
                    GitHub Pull Request URL
                  </label>
                  <input
                    id="pr-url"
                    type="url"
                    required
                    placeholder="https://github.com/owner/repo/pull/123"
                    value={prUrl}
                    onChange={(event) => setPrUrl(event.target.value)}
                    className="min-h-12 w-full rounded-lg border border-lavender-tint bg-white px-4 text-sm text-text shadow-default outline-none placeholder:text-muted-text/50 transition-all focus:border-accent focus:shadow-highlight focus:ring-2 focus:ring-accent/20 md:min-w-0 md:flex-1"
                  />
                  <div className="flex w-full flex-row gap-3 md:shrink-0 md:w-auto">
                    <button
                      type="button"
                      onClick={() => void copyExamplePrUrl()}
                      className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-lavender-tint bg-white px-4 py-2.5 text-sm font-semibold text-accent shadow-sm transition-all hover:border-accent hover:shadow-default active:scale-[0.98] md:flex-none md:px-5"
                    >
                      {exampleCopied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                          복사완료
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" aria-hidden />
                          예시 PR 복사
                        </>
                      )}
                    </button>
                    <button
                      type="submit"
                      disabled={!prUrl.trim()}
                      className="inline-flex min-h-12 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-5"
                    >
                      <span>문제 만들기</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {step === "LOADING" && (
            <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text mb-3">
                PR을 읽고 문제를 준비하고 있어요
              </h2>
              <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
                공개 PR의 변경 내용을 읽고, 한 문항씩 풀 수 있는 객관식 문제를 준비합니다.
              </p>

              {/* 인디케이터 프로그레스 바 */}
              <div className="mt-5 h-0.5 w-full bg-lavender-tint rounded-full relative overflow-hidden">
                <div className="absolute inset-y-0 rounded-full bg-accent animate-[indeterminate_1.6s_ease-in-out_infinite]" />
              </div>

              {prPreview && (
                <PrMetaBox
                  className="mt-8"
                  repository={prPreview.repository}
                  pullNumber={prPreview.pullNumber}
                  prTitle={prPreview.prTitle}
                />
              )}

              <div className="mt-10">
                <div className="flex items-center" aria-label="문제 생성 진행 상태">
                  {loadingPhases.map((phase, index) => {
                    const isCompleted = index < loadingStep;
                    const isCurrent = index === loadingStep;

                    return (
                      <React.Fragment key={phase}>
                        <div
                          className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isCompleted
                              ? "border-accent bg-accent text-white"
                              : isCurrent
                                ? "border-accent bg-white text-accent shadow-default ring-4 ring-accent/15 animate-pulse"
                                : "border-lavender-tint bg-white text-lavender-tint"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4 stroke-[3px]" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-current" />
                          )}
                        </div>
                        {index < loadingPhases.length - 1 && (
                          <div className={`h-0.5 flex-1 transition-colors ${index < loadingStep ? "bg-accent" : "bg-lavender-tint"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <p className="mt-5 text-sm font-semibold text-text/70">
                  {loadingPhases[loadingStep]}
                </p>
              </div>
            </div>
          )}

          {step === "ERROR" && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-default">
                <X className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                <p className="mb-1 text-lg font-bold text-text">문제 생성에 실패했습니다.</p>
                <p className="mb-6 text-sm text-muted-text">
                  {errorMessage || "PR URL을 확인한 뒤 다시 시도해주세요."}
                </p>
                <button
                  type="button"
                  onClick={() => setStep("INPUT")}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
                >
                  다시 입력하기
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ProblemSetNewPage() {
  return (
    <Suspense fallback={null}>
      <ProblemSetNewContent />
    </Suspense>
  );
}
