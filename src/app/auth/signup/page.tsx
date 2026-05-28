"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "../_components/auth-shell";
import { getSession, supabase } from "@/lib/supabase";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getSession().then((session) => {
      if (!session) return;
      router.replace(searchParams.get("redirect") ?? "/");
    });
  }, [router, searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nickname = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setError("");
    setNotice("");

    if (!supabase) {
      setError("Supabase 환경 변수가 없어 회원가입을 처리할 수 없습니다.");
      return;
    }

    supabase.auth
      .signUp({
        email,
        password,
        options: {
          data: { nickname },
        },
      })
      .then(({ error: signUpError }) => {
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setNotice("회원가입이 완료되었습니다. 이메일 인증 설정이 켜져 있다면 메일을 확인해 주세요.");
      });
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

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-100">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 border border-emerald-100">
          {notice}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-muted-text">
        이미 계정이 있나요?{" "}
        <Link href="/auth/login" className="font-bold text-accent transition-colors hover:text-primary">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
