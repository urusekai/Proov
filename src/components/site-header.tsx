"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

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
  { href: "/problem-sets/new", label: "새 풀이" },
  { href: "/problem-sets", label: "문제 세트" },
  { href: "/history", label: "풀이 기록" },
];

export function SiteHeader({ activePath }: { activePath?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLinkActive = (href: string) =>
    activePath === href ||
    (href !== "/problem-sets/new" && activePath?.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-lavender-tint">
      <div className="w-full max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity"
          >
            <ProovLogo className="w-[18px] h-[18px] text-accent" />
            <span>Proov</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-text">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-accent transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:transition-transform ${
                  isLinkActive(link.href)
                    ? "text-accent after:scale-x-100"
                    : "after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted-text hover:text-text px-4 py-2 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-medium bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-primary transition-all hover:shadow-default active:scale-[0.98]"
          >
            회원가입
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-text hover:text-text hover:bg-lavender-tint/50 rounded-lg transition-colors"
          aria-label="메뉴 열기"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-lavender-tint px-4 py-4">
          <nav className="flex flex-col gap-4 text-sm font-medium text-muted-text mb-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-accent py-1 transition-colors ${
                  isLinkActive(link.href) ? "text-accent" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-text hover:text-text py-2.5 border border-lavender-tint rounded-lg transition-colors text-center"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-accent text-white py-2.5 rounded-lg hover:bg-primary transition-all text-center"
            >
              회원가입
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
