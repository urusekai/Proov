const MOCK_SESSION_KEY = "proov_mock_session";
const MOCK_PASSWORDS_KEY = "proov_mock_passwords";
const AUTH_CHANGE_EVENT = "proov-auth-change";

export type MockSession = {
  user: {
    id: string;
    email: string;
    nickname: string;
    avatar_url: string | null;
  };
};

const MOCK_USERS: Record<string, { password: string; nickname: string; avatar_url: string | null }> = {
  "test@test.com": { password: "test", nickname: "테스트", avatar_url: null },
};

// useSyncExternalStore는 snapshot 함수가 항상 동일한 참조를 반환해야 무한 루프를 피할 수 있다.
// JSON.parse는 매번 새 객체를 반환하므로 파싱 결과를 모듈 레벨에서 캐싱한다.
let _sessionCacheValid = false;
let _sessionCache: MockSession | null = null;

function dispatchAuthChange(): void {
  _sessionCacheValid = false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

/** localStorage에 저장된 사용자별 비밀번호 오버라이드를 반환한다. */
function getMockPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MOCK_PASSWORDS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** 현재 로그인한 사용자의 실제 비밀번호를 반환한다. (오버라이드 → 기본값 순) */
function getPasswordForEmail(email: string): string | null {
  const overrides = getMockPasswords();
  if (email in overrides) return overrides[email];
  return MOCK_USERS[email]?.password ?? null;
}

export function mockSignIn(email: string, password: string): MockSession | null {
  const expected = getPasswordForEmail(email);
  if (expected !== null && expected === password) {
    const base = MOCK_USERS[email];
    const session: MockSession = {
      user: {
        id: "mock-user-1",
        email,
        nickname: base?.nickname ?? email,
        avatar_url: base?.avatar_url ?? null,
      },
    };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    dispatchAuthChange();
    return session;
  }
  return null;
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  if (_sessionCacheValid) return _sessionCache;
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) {
      _sessionCache = null;
      _sessionCacheValid = true;
      return null;
    }
    const parsed = JSON.parse(raw) as MockSession;
    // 구 형식 세션(nickname 없음)은 무효 처리 후 재로그인 유도
    if (!parsed?.user?.nickname) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      _sessionCache = null;
      _sessionCacheValid = true;
      return null;
    }
    _sessionCache = parsed;
    _sessionCacheValid = true;
    return _sessionCache;
  } catch {
    _sessionCache = null;
    _sessionCacheValid = true;
    return null;
  }
}

export function mockSignOut(): void {
  localStorage.removeItem(MOCK_SESSION_KEY);
  dispatchAuthChange();
}

/** MVP 프론트 목업용 회원탈퇴: 현재 세션과 사용자별 비밀번호 오버라이드를 제거한다. */
export function mockDeleteAccount(): void {
  const session = getMockSession();
  if (session) {
    const overrides = getMockPasswords();
    delete overrides[session.user.email];
    localStorage.setItem(MOCK_PASSWORDS_KEY, JSON.stringify(overrides));
  }
  localStorage.removeItem(MOCK_SESSION_KEY);
  dispatchAuthChange();
}

/** profiles 테이블 업데이트에 해당: 닉네임·아바타 변경 */
export function mockUpdateProfile(updates: { nickname?: string; avatar_url?: string | null }): MockSession | null {
  const session = getMockSession();
  if (!session) return null;
  const updated: MockSession = {
    user: {
      ...session.user,
      ...(updates.nickname !== undefined ? { nickname: updates.nickname } : {}),
      ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
    },
  };
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(updated));
  dispatchAuthChange();
  return updated;
}

/**
 * auth.users 비밀번호 변경에 해당.
 * currentPassword가 일치해야 newPassword로 교체한다.
 * 성공 시 true, 현재 비밀번호 불일치 시 false 반환.
 */
export function mockChangePassword(currentPassword: string, newPassword: string): boolean {
  const session = getMockSession();
  if (!session) return false;

  const expected = getPasswordForEmail(session.user.email);
  if (expected === null || expected !== currentPassword) return false;

  const overrides = getMockPasswords();
  overrides[session.user.email] = newPassword;
  localStorage.setItem(MOCK_PASSWORDS_KEY, JSON.stringify(overrides));
  return true;
}

export function subscribeMockAuth(onStoreChange: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
