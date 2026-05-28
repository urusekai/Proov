"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Trash2, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getMockSession,
  mockChangePassword,
  mockDeleteAccount,
  mockUpdateProfile,
  subscribeMockAuth,
  type MockSession,
} from "@/lib/mock-auth";

function getServerSnapshot(): MockSession | null {
  return null;
}

export default function MyPage() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeMockAuth, getMockSession, getServerSnapshot);

  // 프로필 폼
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null | undefined>(undefined);
  const [nicknameError, setNicknameError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // 비밀번호 폼
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = getMockSession();
    if (!current) {
      router.replace("/auth/login?redirect=/mypage");
    }
  }, [router]);

  const nickname = nicknameDraft ?? session?.user.nickname ?? "";
  const avatarUrl = avatarUrlDraft === undefined ? session?.user.avatar_url ?? null : avatarUrlDraft;

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setAvatarError("이미지는 1MB 이하로 업로드해 주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setAvatarUrlDraft(reader.result);
      setAvatarError("");
      if (profileSaved) setProfileSaved(false);
    };
    reader.onerror = () => {
      setAvatarError("이미지를 불러오지 못했습니다.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarUrlDraft(null);
    setAvatarError("");
    if (profileSaved) setProfileSaved(false);
  };

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError("닉네임을 입력해 주세요.");
      return;
    }
    if (trimmed.length < 2) {
      setNicknameError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    if (trimmed.length > 20) {
      setNicknameError("닉네임은 20자 이하여야 합니다.");
      return;
    }
    setNicknameError("");
    if (avatarError) return;
    mockUpdateProfile({ nickname: trimmed, avatar_url: avatarUrl });
    setNicknameDraft(null);
    setAvatarUrlDraft(undefined);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError("");

    if (!currentPw) {
      setPwError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    if (!newPw) {
      setPwError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPw.length < 4) {
      setPwError("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    const ok = mockChangePassword(currentPw, newPw);
    if (!ok) {
      setPwError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }

    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  };

  const handleDeleteAccount = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (deleteConfirm.trim() !== session?.user.email) {
      setDeleteError("탈퇴하려면 현재 이메일을 정확히 입력해 주세요.");
      return;
    }
    mockDeleteAccount();
    router.replace("/");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SiteHeader activePath="/mypage" />

      <main className="flex-grow">
        <div className="max-w-[1248px] mx-auto px-6 pt-10 pb-16">
          {/* 페이지 헤더 */}
          <div className="mb-10">
            <h1 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-text">마이페이지</h1>
            <p className="mt-3 text-base md:text-lg text-muted-text leading-relaxed max-w-2xl">
              계정 정보를 확인하고 프로필과 비밀번호를 수정할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-xl border border-lavender-tint bg-white p-6 shadow-default lg:sticky lg:top-24">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={session.user.nickname}
                    className="h-16 w-16 shrink-0 rounded-full object-cover lg:h-20 lg:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-extrabold text-accent select-none lg:h-20 lg:w-20 lg:text-3xl">
                    {session.user.nickname.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-text">{session.user.nickname}</p>
                  <p className="mt-1 truncate text-sm text-muted-text">{session.user.email}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-lavender-tint pt-5">
                <div>
                  <p className="text-xs font-bold text-muted-text/70">계정 상태</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-600">활성</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-text/70">로그인 방식</p>
                  <p className="mt-1 text-sm font-extrabold text-text">이메일</p>
                </div>
              </div>
            </aside>

            <div className="space-y-6">

            {/* 프로필 수정 카드 (profiles 테이블) */}
            <div className="rounded-xl border border-lavender-tint bg-white shadow-default p-6">
              <h2 className="text-base font-extrabold text-text mb-5">프로필 정보</h2>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* 프로필 이미지 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">프로필 이미지</label>
                  <div className="flex items-center gap-4 rounded-lg border border-lavender-tint bg-background/40 px-4 py-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${nickname || session.user.nickname} 프로필 이미지`}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-extrabold text-accent select-none">
                        {(nickname || session.user.nickname).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <label
                          htmlFor="avatar-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-lavender-tint bg-white px-3 py-2 text-sm font-bold text-text transition-colors hover:border-accent hover:text-accent"
                        >
                          <Camera className="h-4 w-4" />
                          이미지 선택
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="sr-only"
                        />
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleAvatarRemove}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-text/70">1MB 이하 이미지 파일을 사용할 수 있습니다.</p>
                    </div>
                  </div>
                  {avatarError && <p className="mt-1.5 text-xs font-medium text-rose-500">{avatarError}</p>}
                </div>

                {/* 이메일 (읽기 전용) */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">이메일</label>
                  <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-background/60 px-4">
                    <Mail className="h-4 w-4 shrink-0 text-muted-text/50" />
                    <input
                      type="email"
                      value={session.user.email}
                      readOnly
                      className="min-h-12 w-full bg-transparent text-sm text-muted-text outline-none cursor-default select-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-text/70">이메일은 변경할 수 없습니다.</p>
                </div>

                {/* 닉네임 */}
                <div>
                  <label htmlFor="nickname" className="mb-2 block text-sm font-semibold text-text">
                    닉네임
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-lg border bg-white px-4 transition-all focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20 ${
                      nicknameError
                        ? "border-rose-400 focus-within:border-rose-400"
                        : "border-lavender-tint focus-within:border-accent"
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0 text-muted-text" />
                    <input
                      id="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => {
                        setNicknameDraft(e.target.value);
                        if (nicknameError) setNicknameError("");
                        if (profileSaved) setProfileSaved(false);
                      }}
                      placeholder="닉네임을 입력하세요"
                      maxLength={20}
                      className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
                    />
                    <span className="text-xs text-muted-text/60 tabular-nums shrink-0">{nickname.length}/20</span>
                  </div>
                  {nicknameError && (
                    <p className="mt-1.5 text-xs font-medium text-rose-500">{nicknameError}</p>
                  )}
                </div>

                {profileSaved && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">프로필이 저장되었습니다.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
                >
                  저장
                </button>
              </form>
            </div>

            {/* 비밀번호 변경 카드 (auth.users) */}
            <div className="rounded-xl border border-lavender-tint bg-white shadow-default p-6">
              <h2 className="text-base font-extrabold text-text mb-5">비밀번호 변경</h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* 현재 비밀번호 */}
                <div>
                  <label htmlFor="current-pw" className="mb-2 block text-sm font-semibold text-text">
                    현재 비밀번호
                  </label>
                  <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-muted-text" />
                    <input
                      id="current-pw"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => {
                        setCurrentPw(e.target.value);
                        if (pwError) setPwError("");
                        if (pwSaved) setPwSaved(false);
                      }}
                      placeholder="현재 비밀번호"
                      className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      aria-label={showCurrentPw ? "숨기기" : "보기"}
                      className="rounded-md p-1 text-muted-text transition-colors hover:bg-lavender-tint/40 hover:text-text"
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <label htmlFor="new-pw" className="mb-2 block text-sm font-semibold text-text">
                    새 비밀번호
                  </label>
                  <div className="flex items-center gap-3 rounded-lg border border-lavender-tint bg-white px-4 transition-all focus-within:border-accent focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-muted-text" />
                    <input
                      id="new-pw"
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => {
                        setNewPw(e.target.value);
                        if (pwError) setPwError("");
                        if (pwSaved) setPwSaved(false);
                      }}
                      placeholder="새 비밀번호 (4자 이상)"
                      className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? "숨기기" : "보기"}
                      className="rounded-md p-1 text-muted-text transition-colors hover:bg-lavender-tint/40 hover:text-text"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* 새 비밀번호 확인 */}
                <div>
                  <label htmlFor="confirm-pw" className="mb-2 block text-sm font-semibold text-text">
                    새 비밀번호 확인
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-lg border bg-white px-4 transition-all focus-within:shadow-default focus-within:ring-2 focus-within:ring-accent/20 ${
                      confirmPw && newPw !== confirmPw
                        ? "border-rose-400 focus-within:border-rose-400"
                        : "border-lavender-tint focus-within:border-accent"
                    }`}
                  >
                    <LockKeyhole className="h-4 w-4 shrink-0 text-muted-text" />
                    <input
                      id="confirm-pw"
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => {
                        setConfirmPw(e.target.value);
                        if (pwError) setPwError("");
                        if (pwSaved) setPwSaved(false);
                      }}
                      placeholder="새 비밀번호 재입력"
                      className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted-text/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? "숨기기" : "보기"}
                      className="rounded-md p-1 text-muted-text transition-colors hover:bg-lavender-tint/40 hover:text-text"
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPw && newPw !== confirmPw && (
                    <p className="mt-1.5 text-xs font-medium text-rose-500">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                {pwError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
                    <p className="text-sm font-medium text-rose-600">{pwError}</p>
                  </div>
                )}

                {pwSaved && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">비밀번호가 변경되었습니다.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary hover:shadow-default active:scale-[0.98]"
                >
                  비밀번호 변경
                </button>
              </form>
            </div>

              <div className="rounded-xl border border-rose-100 bg-white p-6 shadow-default">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-extrabold text-text">회원탈퇴</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-text">
                      탈퇴하면 현재 브라우저의 로그인 세션과 목업 계정 설정이 삭제됩니다.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="delete-confirm" className="mb-2 block text-sm font-semibold text-text">
                      확인용 이메일
                    </label>
                    <input
                      id="delete-confirm"
                      type="email"
                      value={deleteConfirm}
                      onChange={(e) => {
                        setDeleteConfirm(e.target.value);
                        if (deleteError) setDeleteError("");
                      }}
                      placeholder={session.user.email}
                      className="min-h-12 w-full rounded-lg border border-lavender-tint bg-white px-4 text-sm text-text outline-none transition-all placeholder:text-muted-text/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    />
                    {deleteError ? (
                      <p className="mt-1.5 text-xs font-medium text-rose-500">{deleteError}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-text/70">현재 이메일을 입력해야 탈퇴할 수 있습니다.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={deleteConfirm.trim() !== session.user.email}
                    className="w-full rounded-lg bg-rose-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-rose-600 hover:shadow-default active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-rose-200 disabled:shadow-none disabled:active:scale-100"
                  >
                    회원탈퇴
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
