import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import { curatedToDetail, dbToDetail } from "@/lib/problem-set-mappers";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!hasSupabaseServerEnv()) {
    return jsonError(503, "SERVICE_UNAVAILABLE", "서비스를 사용할 수 없습니다.");
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const supabase = createSupabaseAdmin();
  const { data: problemSet, error } = await supabase
    .from("problem_sets")
    .select("id, user_id, source_type")
    .eq("id", id)
    .single();

  if (error || !problemSet) {
    return jsonError(404, "NOT_FOUND", "문제 세트를 찾을 수 없습니다.");
  }
  if (problemSet.user_id !== user.id) {
    return jsonError(403, "FORBIDDEN", "삭제 권한이 없습니다.");
  }
  if (problemSet.source_type !== "GENERATED") {
    return jsonError(403, "FORBIDDEN", "큐레이션 문제 세트는 삭제할 수 없습니다.");
  }

  const { error: deleteError } = await supabase
    .from("problem_sets")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return jsonError(500, "DELETE_FAILED", "삭제에 실패했습니다.");
  }

  return new Response(null, { status: 204 });
}

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
