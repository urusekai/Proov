"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { AuthShell } from "../_components/auth-shell";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <AuthShell
      title="풀이 기록을 이어서 확인하세요."
      description="로그인하면 PR 문제 풀이 결과를 저장하고, 이전 기록에서 다시 확인할 수 있습니다."
    >
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Login</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">로그인</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-text">
            이메일
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
            <Mail className="h-4 w-4 shrink-0 text-muted-text" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-semibold text-text">
              비밀번호
            </label>
            <button type="button" className="text-xs font-semibold text-accent transition-colors hover:text-primary">
              비밀번호 찾기
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
            <LockKeyhole className="h-4 w-4 shrink-0 text-muted-text" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="비밀번호를 입력하세요"
              className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="rounded-md p-1 text-muted-text transition-colors hover:bg-lavender-tint/40 hover:text-text focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-muted-text">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-lavender-tint text-accent focus:ring-accent"
          />
          로그인 상태 유지
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
        >
          로그인
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-text">
        아직 계정이 없나요?{" "}
        <Link href="/auth/signup" className="font-bold text-accent transition-colors hover:text-primary">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
