"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { Check, ArrowRight, Lock, Link2, Sparkles, ClipboardList, History, ChevronRight, X } from "lucide-react";
import { publicQuestionSummaries } from "@/data/curated-problem-sets";
import { apiFetch, type AppSession } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useQuestionProgress } from "@/lib/use-question-progress";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemQuestionCard } from "@/components/problem-question-card";
import type { SubmissionListItemData } from "@/lib/types";
import { SubmissionListItem } from "@/components/submission-list-item";

// Proov SVG Logo Component
const ProovLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.2969 18.5801C12.7563 19.7463 12.4531 21.045 12.4531 22.415C12.4531 27.4585 16.5415 31.5469 21.585 31.5469C22.9548 31.5469 24.2528 31.2426 25.4189 30.7021L38.3613 43.6445C37.6149 43.8748 36.8221 44 36 44H8C3.58172 44 1.28855e-07 40.4183 0 36V8C2.3982e-08 7.17769 0.124055 6.38435 0.354492 5.6377L13.2969 18.5801ZM36 0C40.4183 1.28851e-07 44 3.58172 44 8V36C44 36.8221 43.8748 37.6149 43.6445 38.3613L30.3301 25.0469C30.5806 24.2134 30.7168 23.3302 30.7168 22.415C30.7168 17.3716 26.6284 13.2832 21.585 13.2832C20.6696 13.2832 19.7859 13.4183 18.9521 13.6689L5.6377 0.354492C6.38435 0.124055 7.17769 2.39812e-08 8 0H36Z"
      fill="currentColor"
    />
  </svg>
);

const PORTFOLIO_SET_IDS = [
  "zustand-devtools-type-declaration",
  "react-hook-form-bulk-value-notification",
  "zod-object-fallback-semantics",
];
const featuredQuestions = PORTFOLIO_SET_IDS
  .map((id) => publicQuestionSummaries.find((q) => q.problemSetId === id))
  .filter((q): q is NonNullable<typeof q> => q != null);

function getDailyRandomSets(count: number) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  const seenSets = new Set<string>();
  return [...publicQuestionSummaries]
    .map((ps) => ({ ps, order: (seed * 31 + ps.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 997 }))
    .sort((a, b) => a.order - b.order)
    .filter(({ ps }) => {
      if (seenSets.has(ps.problemSetId)) return false;
      seenSets.add(ps.problemSetId);
      return true;
    })
    .slice(0, count)
    .map(({ ps }) => ps);
}

function DashboardView({ session }: { session: AppSession }) {
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionListItemData[]>([]);

  const dailyQuestions = getDailyRandomSets(3);
  const questionProgress = useQuestionProgress({ refreshOnMount: true });

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { items: SubmissionListItemData[] }) => {
        if (cancelled) return;
        const sorted = [...data.items].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setRecentSubmissions(sorted.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setRecentSubmissions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent/20">
      <SiteHeader activePath="/" />

      <main className="flex-grow">
        {/* Hero / CTA Section */}
        <section className="py-16 md:py-20 bg-white border-b border-lavender-tint">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            <p className="text-lg md:text-xl font-semibold text-accent mb-3">
              안녕하세요, {session.user.nickname}님!
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-3">
              오늘은 어떤 문제를 풀어볼까요?
            </h1>
            <p className="text-base md:text-lg text-muted-text leading-relaxed mb-8 max-w-xl whitespace-pre-line">
              {"공개 GitHub PR을 입력하여 나만의 문제를 생성하거나,\n큐레이션된 문제에서 바로 시작할 수 있습니다."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/problem-sets/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                새 문제 만들기
              </Link>
              <Link
                href="/problem-sets"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-lavender-tint bg-white px-7 py-3.5 text-sm font-semibold text-accent shadow-sm transition-all hover:border-accent hover:shadow-default active:scale-[0.98]"
              >
                문제 목록 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Daily Recommended Sets Section */}
        <section className="py-12 md:py-14 bg-background">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">오늘의 추천 문제</h2>
              <Link href="/problem-sets" className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-primary transition-colors">
                전체 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {dailyQuestions.map((ps) => (
                <ProblemQuestionCard
                  key={ps.id}
                  item={ps}
                  progressStatus={questionProgress.get(ps.id) ?? "untried"}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Recent History Section */}
        <section className="pb-16 bg-background">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">최근 풀이 기록</h2>
              <Link href="/history" className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-primary transition-colors">
                전체 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="rounded-xl border border-lavender-tint bg-white px-8 py-12 text-center shadow-default">
                <History className="w-10 h-10 text-lavender-tint mx-auto mb-3" />
                <p className="text-base font-bold text-text mb-1">아직 풀이 기록이 없습니다</p>
                <p className="text-sm text-muted-text mb-5">문제를 풀면 여기에 기록됩니다.</p>
                <Link
                  href="/problem-sets/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-lg hover:bg-primary transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  첫 문제 만들기
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden">
                {recentSubmissions.map((sub, idx) => (
                  <SubmissionListItem
                    key={sub.id}
                    {...sub}
                    isLast={idx === recentSubmissions.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function Home() {
  const { status, session } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (session) {
    return <DashboardView session={session} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-accent/20">
      <SiteHeader activePath="/" />

      {/* Main Contents */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden flex flex-col items-center justify-center py-24 md:py-36 bg-white">

          <div className="w-full max-w-[1248px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            {/* Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-[52px] leading-tight md:leading-[1.25] font-extrabold tracking-tight text-text mb-6 whitespace-pre-line animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            >
              {"AI가 짜준 코드,\n얼마나 이해하고 있나요?"}
            </h1>

            {/* Description */}
            <p
              className="text-base md:text-lg text-muted-text leading-relaxed mb-10 max-w-2xl whitespace-pre-line animate-fade-in-up"
              style={{ animationDelay: "240ms" }}
            >
              {"AI가 코드를 짜주는 시대, 구현보다 이해가 중요합니다.\n유형 암기로 푸는 코딩테스트가 아닌,\n실제 PR을 기반으로 코드 이해력을 키워보세요."}
            </p>

            {/* Dual CTA */}
            <div
              className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: "360ms" }}
            >
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-sm md:text-base font-semibold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>로그인하고 나만의 문제 만들기</span>
              </Link>
              <Link
                href="/problem-sets"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-lavender-tint bg-white px-8 py-3.5 text-sm md:text-base font-semibold text-accent shadow-sm transition-all hover:border-accent hover:shadow-default active:scale-[0.98]"
              >
                <span>로그인 없이 문제 풀어보기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </section>

        {/* How it works Section */}
        <section className="py-20 md:py-28 bg-background border-t border-lavender-tint">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
                3단계로 끝나는 코드 이해력 훈련
              </h2>
              <p className="text-base text-muted-text">
                복잡한 설정 없이, PR 링크 하나면 충분합니다.
              </p>
            </div>

            {/* Workflow */}
            <div className="flex flex-col md:flex-row items-stretch gap-0">
              {[
                {
                  icon: <Link2 className="w-6 h-6" />,
                  title: "PR URL 붙여넣기",
                  desc: "분석하고 싶은 공개 GitHub PR 링크를 입력합니다.\n내가 작성한 PR이든, 오픈소스 PR이든 상관없습니다.",
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "AI 문제 생성",
                  desc: "코드 변경의 핵심 의도를 분석해\n맞춤형 문제를 자동 출제합니다.",
                },
                {
                  icon: <ClipboardList className="w-6 h-6" />,
                  title: "문제 풀이 & 결과 확인",
                  desc: "문제를 풀고 제출하면 정답과 해설지를 제공합니다.\n기록으로 남기고 대시보드로 확인할 수 있습니다.",
                },
              ].map(({ icon, title, desc }, i) => (
                <React.Fragment key={title}>
                  <div className="flex-1 flex flex-col items-center text-center px-8 py-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-5 shrink-0">
                      {icon}
                    </div>
                    <h3 className="text-lg font-bold text-text mb-3">{title}</h3>
                    <p className="text-sm text-muted-text leading-relaxed whitespace-pre-line">{desc}</p>
                  </div>

                  {i < 2 && (
                    <>
                      {/* 모바일: 세로 화살표 */}
                      <div className="flex md:hidden flex-col items-center gap-0 py-1">
                        <div className="w-0.5 h-5 bg-gradient-to-b from-accent/30 to-accent/60" />
                        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-accent rotate-90" />
                        </div>
                        <div className="w-0.5 h-5 bg-gradient-to-b from-accent/60 to-accent/30" />
                      </div>
                      {/* 데스크톱: 가로 화살표 */}
                      <div className="hidden md:flex items-center gap-0 shrink-0 self-center">
                        <div className="h-0.5 w-5 bg-gradient-to-r from-accent/30 to-accent/60" />
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-accent" />
                        </div>
                        <div className="h-0.5 w-5 bg-gradient-to-r from-accent/60 to-accent/30" />
                      </div>
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="py-20 md:py-28 bg-white border-t border-lavender-tint">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
                코드 이해력을 키우는 새로운 방법
              </h2>
              <p className="text-base text-muted-text">
                실무에서 코드를 마주하는 방식 그대로, 읽고 이해하는 힘을 기릅니다.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8 w-full">
              {/* Card 1: Existing Coding Test */}
              <div className="bg-white rounded-xl p-8 border border-lavender-tint shadow-default hover:shadow-highlight transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-muted-text">
                    기존 코딩테스트
                  </h3>
                </div>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">정해진 템플릿 문제</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        실제 프로덕션 코드와 거리가 먼 인위적인 조건의 문제들
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">단순 알고리즘 암기</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        수학적 직관이나 특정 알고리즘 패턴 암기 위주의 테스트
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">풀이 시간 경쟁</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        디버깅 및 아키텍처 이해보다 제한 시간 내 코딩 속도 집중
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                      <X className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">실무와 무관한 일회성 스킬</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        합격 후 다시는 쓰지 않는 알고리즘 풀이용 테크닉
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Card 2: Proov */}
              <div className="bg-white rounded-xl p-8 border-2 border-accent shadow-highlight relative overflow-hidden transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-accent">
                    PROOV
                  </h3>
                </div>
                <ul className="space-y-6">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-lavender-tint flex items-center justify-center text-accent mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">실제 PR 기반 출제</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        실무 프로젝트의 pull request 코드 변경점을 분석하며 생성
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-lavender-tint flex items-center justify-center text-accent mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">코드 이해력 및 아키텍처 파악</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        기존 코드와의 정합성, 영향도, 비즈니스 흐름 통제 능력 평가
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-lavender-tint flex items-center justify-center text-accent mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">매번 새로운 맞춤형 문제</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        입력하는 PR에 따라 고유하고 논리적인 맞춤형 객관식 문제 출제
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-lavender-tint flex items-center justify-center text-accent mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text mb-1">실질적인 코드 리뷰 역량</h4>
                      <p className="text-sm text-muted-text leading-relaxed">
                        동료의 코드를 제대로 리뷰하고 피드백할 수 있는지 측정
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Problem Sets Section */}
        <section className="py-20 md:py-28 bg-background border-t border-lavender-tint">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
                지금 바로 풀 수 있는 문제
              </h2>
              <p className="text-base text-muted-text">
                로그인 없이 큐레이션된 문제를 바로 풀어볼 수 있습니다.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredQuestions.map((ps) => (
                <ProblemQuestionCard key={ps.id} item={ps} />
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/problem-sets"
                className="inline-flex items-center gap-2 text-sm font-bold border border-lavender-tint text-accent hover:text-primary hover:border-accent hover:bg-lavender-tint/20 px-6 py-3 rounded-lg transition-all active:scale-[0.98]"
              >
                <span>전체 문제 보기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-lavender-tint/50 py-12 text-sm text-muted-text">
        <div className="max-w-[1248px] mx-auto px-6 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity">
            <ProovLogo className="w-[18px] h-[18px] text-accent" />
            <span>Proov</span>
          </Link>
          <p className="text-xs text-muted-text text-center">
            &copy; 2026 Proov. All rights reserved. Code Comprehension for Modern Teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
