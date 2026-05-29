import { createSupabaseAdmin, hasSupabaseServerEnv } from "@/lib/server/supabase-admin";
import {
  curatedToQuestionSummaries,
  dbToDetail,
  detailToQuestionSummaries,
} from "@/lib/problem-set-mappers";

export async function GET() {
  if (!hasSupabaseServerEnv()) {
    return Response.json({ items: curatedToQuestionSummaries() });
  }

  const supabase = createSupabaseAdmin();
  const { data: problemSets, error } = await supabase
    .from("problem_sets")
    .select("*")
    .eq("visibility", "PUBLIC")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ items: curatedToQuestionSummaries() });
  }

  if (!problemSets || problemSets.length === 0) {
    return Response.json({ items: curatedToQuestionSummaries() });
  }

  const ids = problemSets.map((set) => set.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("problem_set_id", ids)
    .order("order_index", { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);
  const submissionCountMap = new Map<string, number>();

  if (questionIds.length > 0) {
    const { data: answerRows } = await supabase
      .from("submission_answers")
      .select("question_id")
      .in("question_id", questionIds);

    for (const row of answerRows ?? []) {
      submissionCountMap.set(row.question_id, (submissionCountMap.get(row.question_id) ?? 0) + 1);
    }
  }

  const items = problemSets.flatMap((set) => {
    const setQuestions = (questions ?? []).filter((question) => question.problem_set_id === set.id);
    return detailToQuestionSummaries(dbToDetail(set, setQuestions, false), submissionCountMap);
  });

  return Response.json({ items });
}
