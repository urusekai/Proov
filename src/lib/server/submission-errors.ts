import { jsonError } from "@/lib/server/supabase-admin";

type SupabaseLikeError = { code?: string; message?: string };

export function submissionStoreErrorResponse(error: SupabaseLikeError | null) {
  if (error?.code === "PGRST205") {
    return jsonError(
      503,
      "DB_SCHEMA_MISSING",
      "Supabase에 DB 스키마가 적용되지 않았습니다. SQL Editor에서 supabase/schema.sql을 실행해 주세요."
    );
  }

  return jsonError(500, "SUBMISSIONS_FETCH_FAILED", "풀이 기록을 불러오지 못했습니다.");
}
