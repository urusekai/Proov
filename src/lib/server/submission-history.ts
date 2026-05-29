import type { createSupabaseAdmin } from "@/lib/server/supabase-admin";
import type { SubmissionListItemData } from "@/lib/types";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

/** 같은 문항에 대한 기존 제출 ID (최신 1건) */
export async function findSubmissionIdForQuestion(
  supabase: SupabaseAdmin,
  userId: string,
  questionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, submission_answers!inner(question_id)")
    .eq("user_id", userId)
    .eq("submission_answers.question_id", questionId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

/** 문항별 최신 기록만 남김 (과거 중복 row 대비) */
export function dedupeSubmissionsByQuestion(
  items: SubmissionListItemData[]
): SubmissionListItemData[] {
  const latestByQuestion = new Map<string, SubmissionListItemData>();

  for (const item of items) {
    const questionId = item.answers[0]?.questionId;
    const key = questionId ?? item.id;
    const existing = latestByQuestion.get(key);
    if (
      !existing ||
      new Date(item.submittedAt).getTime() > new Date(existing.submittedAt).getTime()
    ) {
      latestByQuestion.set(key, item);
    }
  }

  return [...latestByQuestion.values()].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}
