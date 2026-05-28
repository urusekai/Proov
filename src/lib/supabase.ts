import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getMockSession } from "./mock-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function getSession() {
  const mock = getMockSession();
  if (mock) return mock;

  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
