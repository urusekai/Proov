"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "../_components/auth-shell";
import { getMockSession } from "@/lib/mock-auth";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (getMockSession()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Sign up</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">회원가입</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-text">
            이름
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
            <User className="h-4 w-4 shrink-0 text-muted-text" />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="홍길동"
              className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-text">
            비밀번호
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
            <LockKeyhole className="h-4 w-4 shrink-0 text-muted-text" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8자 이상 입력하세요"
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

        <label className="flex items-start gap-2 text-sm font-medium leading-relaxed text-muted-text">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-lavender-tint text-accent focus:ring-accent"
          />
          <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
        >
          회원가입
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-text">
        이미 계정이 있나요?{" "}
        <Link href="/auth/login" className="font-bold text-accent transition-colors hover:text-primary">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
