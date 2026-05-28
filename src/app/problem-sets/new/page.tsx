"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, GitPullRequest, X } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { apiFetch, getSession } from "@/lib/supabase";

const loadingPhases = [
  "Pull Request URL을 확인하고 있습니다.",
  "PR 제목, 설명, 변경 파일을 불러오고 있습니다.",
  "학습에 필요한 코드 변경만 선별하고 있습니다.",
  "코드 이해력을 확인할 객관식 3문항을 준비하고 있습니다.",
  "문제, 태그, 해설, 관련 파일을 마지막으로 점검하고 있습니다.",
];

function ProblemSetNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrUrl = searchParams.get("url") ?? "";
  const [prUrl, setPrUrl] = useState(initialPrUrl);
  const [step, setStep] = useState<"INPUT" | "LOADING" | "ERROR">(
    initialPrUrl ? "LOADING" : "INPUT"
  );
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingDotTick, setLoadingDotTick] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const autoStartedRef = useRef(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        const redirectPath = "/problem-sets/new" + (initialPrUrl ? `?url=${encodeURIComponent(initialPrUrl)}` : "");
        router.replace(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
      } else {
        setAuthChecked(true);
      }
    });
  }, [router, initialPrUrl]);

  useEffect(() => {
    if (step !== "LOADING") return;

    const interval = window.setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingPhases.length - 1) return prev;
        return prev + 1;
      });
    }, 950);

    return () => window.clearInterval(interval);
  }, [router, step]);

  useEffect(() => {
    if (step !== "LOADING") return;

    const interval = window.setInterval(() => {
      setLoadingDotTick((prev) => prev + 1);
    }, 450);

    return () => window.clearInterval(interval);
  }, [step]);

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
          router.push(`/problem-sets/${data.problemSetId}`);
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

  useEffect(() => {
    if (!authChecked || !initialPrUrl || autoStartedRef.current) return;
    autoStartedRef.current = true;
    window.setTimeout(() => startGeneration(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, initialPrUrl]);

  const loadingDots = (loadingDotTick % 3) + 1;

  if (!authChecked) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent/20">
      <SiteHeader activePath="/problem-sets/new" />

      <main className="flex-grow flex items-center justify-center">
        {step === "INPUT" && (
          <div className="w-full max-w-[760px] mx-auto py-16 md:py-24 px-6">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text leading-tight mb-5">
                나만의 문제 만들기
              </h1>
              <p className="text-base md:text-lg text-muted-text leading-relaxed">
                분석하고 싶은 공개 GitHub Pull Request URL을 입력해주세요.
                <br />
                AI가 코드 변경의 핵심 의도를 짚는 3개의 문제를 자동 출제합니다.
              </p>
            </div>

            <form
              onSubmit={handleStart}
              className="rounded-xl border border-lavender-tint bg-white p-2 shadow-default transition-all focus-within:border-accent focus-within:shadow-highlight focus-within:ring-2 focus-within:ring-accent/20 sm:flex sm:gap-2"
            >
              <div className="flex-1">
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
                  className="w-full border-none bg-transparent px-4 py-3.5 text-sm text-text outline-none placeholder:text-muted-text/60 md:text-base"
                />
              </div>

              <button
                type="submit"
                disabled={!prUrl.trim()}
                className="mt-2 w-full cursor-pointer whitespace-nowrap rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto md:text-base inline-flex items-center justify-center gap-2"
              >
                <span>문제 생성</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === "LOADING" && (
          <div className="w-full max-w-[900px] mx-auto py-16 md:py-24 px-4 md:px-6">
            <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text mb-3">
                PR을 읽고 문제를 준비하고 있어요{".".repeat(loadingDots)}
              </h2>
              <p className="text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
                공개 PR의 변경 내용을 읽고, 코드 이해력을 확인할 객관식 3문항을 준비합니다.
              </p>

              <div className="mt-8 rounded-xl border border-lavender-tint bg-background/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                    <GitPullRequest className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-accent truncate">{prUrl}</p>
                    <p className="mt-1 text-sm font-bold text-text">
                      생성이 완료되면 문제 풀이 화면으로 이동합니다.
                    </p>
                  </div>
                </div>
              </div>

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

                <p className="mt-6 text-sm font-medium leading-relaxed text-muted-text">
                  {loadingPhases[loadingStep]}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "ERROR" && (
          <div className="w-full max-w-xl mx-auto px-6">
            <div className="bg-white rounded-xl border border-rose-200 shadow-default p-8 text-center">
              <X className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-text mb-1">문제 생성에 실패했습니다.</p>
              <p className="text-sm text-muted-text mb-6">
                {errorMessage || "PR URL을 확인한 뒤 다시 시도해주세요."}
              </p>
              <button
                type="button"
                onClick={() => setStep("INPUT")}
                className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary hover:shadow-default transition-all active:scale-[0.98]"
              >
                다시 입력하기
              </button>
            </div>
          </div>
        )}
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
