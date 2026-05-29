import { curatedProblemSets, getCuratedCreatedAt } from "@/data/curated-problem-sets";
import { curatedProblemSetDbId, curatedQuestionDbId } from "@/lib/server/stable-id";
import type { QuestionDifficulty } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureCuratedProblemSetInDb(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const curated = curatedProblemSets.find((set) => set.id === slug);
  if (!curated) return null;

  const problemSetId = curatedProblemSetDbId(slug);
  const { data: existing } = await supabase
    .from("problem_sets")
    .select("created_at")
    .eq("id", problemSetId)
    .maybeSingle();

  const { error: setError } = await supabase.from("problem_sets").upsert(
    {
      id: problemSetId,
      user_id: null,
      source_type: "CURATED",
      visibility: "PUBLIC",
      display_title: curated.displayTitle,
      difficulty: curated.difficulty,
      estimated_minutes: 8,
      language_tags: curated.languageTags,
      framework_tags: curated.frameworkTags,
      library_tags: curated.libraryTags,
      topic_tags: curated.topicTags,
      pr_url: curated.sourceUrl,
      pr_title: curated.sourcePrTitle,
      repository_owner: curated.repositoryOwner,
      repository_name: curated.repositoryName,
      pull_number: curated.pullNumber,
      raw_ai_response: { curatedSlug: slug, sourceFiles: curated.sourceFiles },
      created_at: existing?.created_at ?? getCuratedCreatedAt(slug),
    },
    { onConflict: "id" }
  );

  if (setError) {
    throw Object.assign(new Error(setError.message), { code: "CURATED_SYNC_FAILED" });
  }

  const { error: questionsError } = await supabase.from("questions").upsert(
    curated.questions.map((question, index) => ({
      id: curatedQuestionDbId(question.id),
      problem_set_id: problemSetId,
      type: question.type,
      tag: question.tag,
      difficulty: (question as { difficulty?: QuestionDifficulty }).difficulty ?? curated.difficulty,
      title: question.title,
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      related_files: question.relatedFiles,
      order_index: index,
    })),
    { onConflict: "id" }
  );

  if (questionsError) {
    throw Object.assign(new Error(questionsError.message), { code: "CURATED_SYNC_FAILED" });
  }

  return problemSetId;
}

export async function seedAllCuratedProblemSets(supabase: SupabaseClient): Promise<number> {
  let count = 0;
  for (const set of curatedProblemSets) {
    await ensureCuratedProblemSetInDb(supabase, set.id);
    count += 1;
  }
  return count;
}
