"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Menu, X } from "lucide-react";

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

export default function Home() {
  const [prUrl, setPrUrl] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl) return;
    window.location.href = `/practice?url=${encodeURIComponent(prUrl)}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-accent/20">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-lavender-tint">
        <div className="w-full max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity">
              <ProovLogo className="w-[18px] h-[18px] text-accent" />
              <span>Proov</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-text">
              <Link href="/" className="hover:text-accent transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform">
                새 풀이
              </Link>
              <Link href="/history" className="hover:text-accent transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform">
                풀이 기록
              </Link>
            </nav>
          </div>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-muted-text hover:text-text px-4 py-2 transition-colors">
              로그인
            </Link>
            <Link href="/auth/signup" className="text-sm font-medium bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-primary transition-all hover:shadow-default active:scale-[0.98]">
              회원가입
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-text hover:text-text hover:bg-lavender-tint/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-lavender-tint px-4 md:px-6 py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4 text-sm font-medium text-muted-text mb-6">
              <Link href="/" className="hover:text-accent py-1 transition-colors">새 풀이</Link>
              <Link href="/history" className="hover:text-accent py-1 transition-colors">풀이 기록</Link>
            </nav>
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" className="text-sm font-medium text-muted-text hover:text-text py-2.5 border border-lavender-tint rounded-lg transition-colors text-center">
                로그인
              </Link>
              <Link href="/auth/signup" className="text-sm font-medium bg-accent text-white py-2.5 rounded-lg hover:bg-primary transition-all text-center">
                회원가입
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Contents */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 md:py-24 bg-background">

          <div className="w-full max-w-[1248px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[52px] leading-tight md:leading-[1.25] font-extrabold tracking-tight text-text mb-6 whitespace-pre-line animate-fade-in">
              {"AI가 짜준 코드,\n얼마나 이해하고 있나요?"}
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-text leading-relaxed mb-10 max-w-2xl whitespace-pre-line">
              {"AI가 코드를 짜주는 시대, 구현보다 이해가 중요합니다.\n유형 암기로 푸는 코딩테스트가 아닌,\n실제 PR을 기반으로 코드 이해력을 키워보세요."}
            </p>

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 bg-white rounded-xl shadow-default border border-lavender-tint focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-highlight transition-all">
                <input
                  type="text"
                  placeholder="PR 링크를 입력해주세요"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  className="w-full px-5 py-4 text-sm md:text-base text-text bg-transparent placeholder-muted-text/60 border-none outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="bg-accent text-white px-8 py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-primary transition-all active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
              >
                문제 생성
              </button>
            </form>

            {/* Mini Notice */}
            <p className="text-xs md:text-sm text-muted-text">
              로그인 없이 PR 링크 하나로 바로 체험할 수 있습니다.
            </p>
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="min-h-screen flex items-center py-16 md:py-24 bg-background border-t border-b border-lavender-tint/30">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
                코딩테스트의 새로운 기준, Proov
              </h2>
              <p className="text-base text-muted-text">
                실무에서 코드를 마주하는 방식 그대로 평가합니다.
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
              <div className="bg-white rounded-xl p-8 border-2 border-accent shadow-highlight relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-accent">
                    PROOV
                  </h3>
                  <span className="bg-accent/10 text-accent text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full uppercase">
                    Recommended
                  </span>
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
                      <h4 className="text-base font-bold text-text mb-1">코드 독해 및 아키텍처 이해력</h4>
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
                        입력하는 PR에 따라 고유하고 논리적인 3개의 객관식 문제 출제
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

        {/* Dashboard Preview Section */}
        <section className="min-h-screen flex items-center py-16 md:py-24 bg-background">
          <div className="w-full max-w-[1248px] mx-auto px-6">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
                대시보드에서 체계적인 실력 관리
              </h2>
              <p className="text-base text-muted-text max-w-2xl mx-auto">
                로그인하시면 개인화된 대시보드를 통해 나만의 학습 트랙과 누적 기록을 체계적으로 추적합니다.
              </p>
            </div>

            {/* Dashboard Mockup Container */}
            <div className="w-full space-y-6">
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-xl border border-lavender-tint shadow-default hover:shadow-md transition-shadow">
                  <span className="text-xs font-semibold text-muted-text block mb-2">최근 점수</span>
                  <span className="text-3xl font-extrabold text-text">67점</span>
                </div>
                {/* Card 2 */}
                <div className="bg-white p-6 rounded-xl border border-lavender-tint shadow-default hover:shadow-md transition-shadow">
                  <span className="text-xs font-semibold text-muted-text block mb-2">누적 풀이</span>
                  <span className="text-3xl font-extrabold text-text">12개</span>
                </div>
                {/* Card 3 */}
                <div className="bg-white p-6 rounded-xl border border-lavender-tint shadow-default hover:shadow-md transition-shadow">
                  <span className="text-xs font-semibold text-muted-text block mb-2">자주 틀린 유형</span>
                  <span className="text-3xl font-extrabold text-text">Data Flow</span>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background border-b border-lavender-tint text-[11px] font-bold text-muted-text tracking-wider uppercase">
                        <th className="px-6 py-4">Repository</th>
                        <th className="px-6 py-4">PR Title</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lavender-tint text-sm font-medium">
                      {/* Row 1 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4.5 font-mono text-xs text-accent">
                          openai/proov-demo
                        </td>
                        <td className="px-6 py-4.5 text-text">
                          Improve retry logic in API client
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-lavender-tint text-primary">
                            67점
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-muted-text">
                          2026-05-22
                        </td>
                      </tr>
                      {/* Row 2 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4.5 font-mono text-xs text-accent">
                          vercel/next.js
                        </td>
                        <td className="px-6 py-4.5 text-text">
                          Refactor route cache behavior
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-600">
                            100점
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs text-muted-text">
                          2026-05-21
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-4">
                <button className="inline-flex items-center gap-2 text-sm font-bold border border-lavender-tint text-accent hover:text-primary hover:border-accent hover:bg-lavender-tint/20 px-6 py-3 rounded-lg transition-all active:scale-[0.98]">
                  <span>전체 기록 대시보드 바로가기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-lavender-tint/50 py-12 text-sm text-muted-text">
        <div className="max-w-[1248px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity">
              <ProovLogo className="w-[18px] h-[18px] text-accent" />
              <span>Proov</span>
            </Link>
            <p className="text-xs text-muted-text text-center md:text-left">
              &copy; 2026 Proov. All rights reserved. Code Comprehension for Modern Teams.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors">Documentation</a>
            <a href="#" className="hover:text-accent transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
