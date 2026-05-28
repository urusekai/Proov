import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (typeof window !== "undefined") {
  localStorage.removeItem("proov_mock_session");
  localStorage.removeItem("proov_mock_passwords");
}

export type AppSession = {
  user: {
    id: string;
    email: string;
    nickname: string;
    avatar_url: string | null;
  };
};

export async function getSession(): Promise<AppSession | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const metadata = data.session.user.user_metadata;
  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email ?? "",
      nickname: metadata.nickname ?? metadata.name ?? data.session.user.email ?? "user",
      avatar_url: metadata.avatar_url ?? null,
    },
  };
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export function subscribeAuth(onStoreChange: () => void): () => void {
  const authSubscription = supabase?.auth.onAuthStateChange(() => onStoreChange()).data.subscription;

  return () => {
    authSubscription?.unsubscribe();
  };
}
