import React from "react";
import Link from "next/link";

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

export function SiteFooter() {
  return (
    <footer className="bg-background border-t border-lavender-tint/50 py-12 text-sm text-muted-text">
      <div className="max-w-[1248px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity"
          >
            <ProovLogo className="w-[18px] h-[18px] text-accent" />
            <span>Proov</span>
          </Link>
          <p className="text-xs text-muted-text text-center md:text-left">
            &copy; 2026 Proov. All rights reserved. Code Comprehension for
            Modern Teams.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium">
          <Link href="/problem-sets/new" className="hover:text-accent transition-colors">
            새 풀이
          </Link>
          <Link href="/problem-sets" className="hover:text-accent transition-colors">
            문제 세트
          </Link>
          <Link href="/history" className="hover:text-accent transition-colors">
            풀이 기록
          </Link>
          <Link href="/auth/login" className="hover:text-accent transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </footer>
  );
}
