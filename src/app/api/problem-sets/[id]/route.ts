import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import { curatedToDetail, dbToDetail } from "@/lib/problem-set-mappers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const curated = curatedToDetail(id, false);
  if (curated) return Response.json({ item: curated });

  if (!hasSupabaseServerEnv()) {
    return jsonError(404, "NOT_FOUND", "문제 세트를 찾을 수 없습니다.");
  }

  const supabase = createSupabaseAdmin();
  const { data: problemSet, error } = await supabase
    .from("problem_sets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !problemSet) {
    return jsonError(404, "NOT_FOUND", "문제 세트를 찾을 수 없습니다.");
  }

  if (problemSet.visibility !== "PUBLIC") {
    const user = await getAuthenticatedUser(request);
    if (!user || problemSet.user_id !== user.id) {
      return jsonError(404, "NOT_FOUND", "문제 세트를 찾을 수 없습니다.");
    }
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("problem_set_id", id)
    .order("order_index", { ascending: true });

  if (questionsError || !questions) {
    return jsonError(500, "QUESTIONS_FETCH_FAILED", "문제를 불러오지 못했습니다.");
  }

  return Response.json({ item: dbToDetail(problemSet, questions, false) });
}
