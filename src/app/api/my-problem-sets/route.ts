import { createSupabaseAdmin, getAuthenticatedUser, hasSupabaseServerEnv, jsonError } from "@/lib/server/supabase-admin";
import { dbToDetail } from "@/lib/problem-set-mappers";
import type { ProblemSetDetail } from "@/lib/types";

export type MyProblemSetItem = Omit<ProblemSetDetail, "diffFiles" | "sourceFiles" | "baseBranch" | "headBranch">;

export async function GET(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return Response.json({ items: [] });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const supabase = createSupabaseAdmin();

  const { data: problemSets, error } = await supabase
    .from("problem_sets")
    .select("*")
    .eq("user_id", user.id)
    .eq("source_type", "GENERATED")
    .order("created_at", { ascending: false });

  if (error || !problemSets?.length) {
    return Response.json({ items: [] });
  }

  const ids = problemSets.map((s) => s.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("problem_set_id", ids)
    .order("order_index", { ascending: true });

  const items: MyProblemSetItem[] = problemSets.map((set) => {
    const setQuestions = (questions ?? []).filter((q) => q.problem_set_id === set.id);
    const detail = dbToDetail(set, setQuestions, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { diffFiles, sourceFiles, baseBranch, headBranch, ...rest } = detail;
    return rest;
  });

  return Response.json({ items });
}
