"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { siteContentClass } from "@/lib/layout";

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

const navLinks = [
  { href: "/problem-sets", label: "문제 목록" },
  { href: "/problem-sets/new", label: "문제 만들기" },
  { href: "/my-problems", label: "내가 만든 문제" },
  { href: "/history", label: "내 기록" },
];

const headerInnerClass = {
  default: `${siteContentClass} relative h-16 flex items-center justify-between`,
  wide: "relative w-full max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-10 h-16 flex items-center justify-between",
} as const;

const desktopNavClass = (isActive: boolean) =>
  `px-3 py-1.5 rounded-lg transition-all duration-200 ${
    isActive
      ? "bg-accent/10 text-accent font-semibold"
      : "text-muted-text hover:bg-lavender-tint hover:text-text"
  }`;

type SiteHeaderProps = {
  activePath?: string;
  /** 문제 풀이 화면만 wide(전체 폭). 그 외 페이지는 default(콘텐츠 폭 1248px). */
  variant?: keyof typeof headerInnerClass;
};

export function SiteHeader({ activePath, variant = "default" }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status, session } = useAuth();

  const isLinkActive = (href: string): boolean => {
    if (activePath === href) return true;
    if (href === "/problem-sets/new" || activePath === "/problem-sets/new") return false;
    return activePath?.startsWith(`${href}/`) ?? false;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-lavender-tint">
      <div className={headerInnerClass[variant]}>
        <Link
          href="/"
          className="group relative z-10 flex shrink-0 items-center gap-2.5 leading-none"
        >
          <ProovLogo className="w-[22px] h-[22px] text-primary transition-colors duration-200 group-hover:text-accent" />
          <span className="text-primary font-semibold text-lg transition-colors duration-200 group-hover:text-accent">
            Proov
          </span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-sm font-medium md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={desktopNavClass(isLinkActive(link.href))}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
          {status === "loading" ? (
            <div className="h-9 w-[120px] shrink-0" aria-hidden />
          ) : session ? (
            <Link
              href="/mypage"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-lavender-tint transition-all duration-200"
            >
              {session.user.avatar_url ? (
                <img
                  src={session.user.avatar_url}
                  alt={session.user.nickname}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-accent/30 transition-all duration-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-transparent group-hover:ring-accent/30 transition-all duration-200">
                  {session.user.nickname.charAt(0)}
                </div>
              )}
              <span className="text-sm text-muted-text font-medium truncate max-w-[120px] group-hover:text-text transition-colors duration-200">
                {session.user.nickname}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted-text hover:text-text px-4 py-2 rounded-lg hover:bg-lavender-tint transition-all duration-200"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-primary transition-all duration-200 hover:shadow-default active:scale-[0.97]"
              >
                회원가입
              </Link>
            </>
          )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-text hover:text-text hover:bg-lavender-tint rounded-lg transition-all duration-200 active:scale-[0.93]"
            aria-label="메뉴 열기"
          >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-lavender-tint/60 bg-background py-4">
          <div
            className={
              variant === "wide"
                ? "px-4 md:px-6 xl:px-8 2xl:px-10"
                : siteContentClass
            }
          >
            <nav className="flex flex-col gap-1 text-sm font-medium mb-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={desktopNavClass(isLinkActive(link.href))}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {status === "loading" ? (
              <div className="h-20" aria-hidden />
            ) : session ? (
              <Link
                href="/mypage"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity"
              >
                {session.user.avatar_url ? (
                  <img
                    src={session.user.avatar_url}
                    alt={session.user.nickname}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                    {session.user.nickname.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-muted-text font-medium">
                  {session.user.nickname}
                </span>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium text-muted-text hover:text-text py-2.5 border border-lavender-tint rounded-lg hover:bg-lavender-tint transition-all duration-200 text-center active:scale-[0.98]"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium bg-accent text-white py-2.5 rounded-lg hover:bg-primary transition-all duration-200 text-center active:scale-[0.98]"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
