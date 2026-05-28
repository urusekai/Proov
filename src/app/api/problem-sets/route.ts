import { createSupabaseAdmin, hasSupabaseServerEnv } from "@/lib/server/supabase-admin";
import { curatedToSummaries, dbToDetail, detailToSummary } from "@/lib/problem-set-mappers";

export async function GET() {
  if (!hasSupabaseServerEnv()) {
    return Response.json({ items: curatedToSummaries() });
  }

  const supabase = createSupabaseAdmin();
  const { data: problemSets, error } = await supabase
    .from("problem_sets")
    .select("*")
    .eq("visibility", "PUBLIC")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ items: curatedToSummaries() });
  }

  if (!problemSets || problemSets.length === 0) {
    return Response.json({ items: curatedToSummaries() });
  }

  const ids = problemSets.map((set) => set.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("problem_set_id", ids)
    .order("order_index", { ascending: true });

  const items = problemSets.map((set) => {
    const setQuestions = (questions ?? []).filter((question) => question.problem_set_id === set.id);
    return detailToSummary(dbToDetail(set, setQuestions, false));
  });

  return Response.json({ items });
}
