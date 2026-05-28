"use client";

import Link from "next/link";

const ProovLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M13.2969 18.5801C12.7563 19.7463 12.4531 21.045 12.4531 22.415C12.4531 27.4585 16.5415 31.5469 21.585 31.5469C22.9548 31.5469 24.2528 31.2426 25.4189 30.7021L38.3613 43.6445C37.6149 43.8748 36.8221 44 36 44H8C3.58172 44 1.28855e-07 40.4183 0 36V8C2.3982e-08 7.17769 0.124055 6.38435 0.354492 5.6377L13.2969 18.5801ZM36 0C40.4183 1.28851e-07 44 3.58172 44 8V36C44 36.8221 43.8748 37.6149 43.6445 38.3613L30.3301 25.0469C30.5806 24.2134 30.7168 23.3302 30.7168 22.415C30.7168 17.3716 26.6284 13.2832 21.585 13.2832C20.6696 13.2832 19.7859 13.4183 18.9521 13.6689L5.6377 0.354492C6.38435 0.124055 7.17769 2.39812e-08 8 0H36Z"
      fill="currentColor"
    />
  </svg>
);

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-text selection:bg-accent/20">
      <header className="border-b border-lavender-tint bg-background/80 backdrop-blur-md">
        <div className="flex h-16 w-full max-w-none items-center justify-between px-4 md:px-6 xl:px-8 2xl:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-[20px] font-bold leading-none text-primary transition-opacity hover:opacity-90"
            >
              <ProovLogo className="h-[18px] w-[18px] text-accent" />
              <span>Proov</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-text md:flex">
              <Link
                href="/problem-sets/new"
                className="relative py-1 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-accent after:transition-transform hover:text-accent hover:after:scale-x-100"
              >
                문제 만들기
              </Link>
              <Link
                href="/problem-sets"
                className="relative py-1 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-accent after:transition-transform hover:text-accent hover:after:scale-x-100"
              >
                문제 목록
              </Link>
              <Link
                href="/history"
                className="relative py-1 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-accent after:transition-transform hover:text-accent hover:after:scale-x-100"
              >
                내 기록
              </Link>
            </nav>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
          >
            홈으로
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] rounded-xl border border-lavender-tint bg-white p-8 shadow-default">
          {children}
        </div>
      </main>
    </div>
  );
}
