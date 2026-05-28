import { readFileSync, writeFileSync } from "node:fs";
import { curatedProblemSets, getCuratedCreatedAt } from "@/data/curated-problem-sets";
import { curatedProblemSetDbId, curatedQuestionDbId } from "@/lib/server/stable-id";

const SCHEMA_PATH = "supabase/schema.sql";
const SEED_START = "-- Curated public problem sets";
const SEED_END = "-- @@CURATED_SEED_END";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: readonly string[]) {
  return `ARRAY[${values.map((v) => sqlString(v)).join(", ")}]::text[]`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function buildSeedSql(): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("-- Curated public problem sets (generated from src/data/curated-problem-sets.ts)");
  lines.push("insert into public.problem_sets (");
  lines.push(
    "  id, user_id, source_type, visibility, display_title, summary, difficulty, estimated_minutes,"
  );
  lines.push("  language_tags, framework_tags, library_tags, topic_tags,");
  lines.push(
    "  pr_url, pr_title, repository_owner, repository_name, pull_number, raw_ai_response, created_at"
  );
  lines.push(") values");

  const setRows = curatedProblemSets.map((set, index) => {
    const id = curatedProblemSetDbId(set.id);
    const createdAt = getCuratedCreatedAt(set.id);
    const raw = { curatedSlug: set.id, sourceFiles: set.sourceFiles };
    const suffix = index < curatedProblemSets.length - 1 ? "," : "";
    return `  (${[
      sqlString(id),
      "null",
      sqlString("CURATED"),
      sqlString("PUBLIC"),
      sqlString(set.displayTitle),
      sqlString(set.summary),
      sqlString(set.difficulty),
      "8",
      sqlTextArray(set.languageTags),
      sqlTextArray(set.frameworkTags),
      sqlTextArray(set.libraryTags),
      sqlTextArray(set.topicTags),
      sqlString(set.sourceUrl),
      sqlString(set.sourcePrTitle),
      sqlString(set.repositoryOwner),
      sqlString(set.repositoryName),
      String(set.pullNumber),
      sqlJson(raw),
      `${sqlString(createdAt)}::timestamptz`,
    ].join(", ")})${suffix}`;
  });

  lines.push(...setRows);
  lines.push("on conflict (id) do update set");
  lines.push("  display_title = excluded.display_title,");
  lines.push("  summary = excluded.summary,");
  lines.push("  difficulty = excluded.difficulty,");
  lines.push("  language_tags = excluded.language_tags,");
  lines.push("  framework_tags = excluded.framework_tags,");
  lines.push("  library_tags = excluded.library_tags,");
  lines.push("  topic_tags = excluded.topic_tags,");
  lines.push("  pr_url = excluded.pr_url,");
  lines.push("  pr_title = excluded.pr_title,");
  lines.push("  repository_owner = excluded.repository_owner,");
  lines.push("  repository_name = excluded.repository_name,");
  lines.push("  pull_number = excluded.pull_number,");
  lines.push("  raw_ai_response = excluded.raw_ai_response,");
  lines.push("  created_at = excluded.created_at;");
  lines.push("");
  lines.push("insert into public.questions (");
  lines.push(
    "  id, problem_set_id, type, tag, question, options, answer, explanation, related_files, order_index"
  );
  lines.push(") values");

  const questionRows: string[] = [];
  for (const set of curatedProblemSets) {
    const problemSetId = curatedProblemSetDbId(set.id);
    set.questions.forEach((question, index) => {
      questionRows.push(
        `  (${[
          sqlString(curatedQuestionDbId(question.id)),
          sqlString(problemSetId),
          sqlString("MULTIPLE_CHOICE"),
          sqlString(question.tag),
          sqlString(question.question),
          sqlJson(question.options),
          sqlString(question.answer),
          sqlString(question.explanation),
          sqlTextArray(question.relatedFiles),
          String(index),
        ].join(", ")})`
      );
    });
  }

  lines.push(questionRows.join(",\n"));
  lines.push("on conflict (id) do update set");
  lines.push("  question = excluded.question,");
  lines.push("  options = excluded.options,");
  lines.push("  answer = excluded.answer,");
  lines.push("  explanation = excluded.explanation,");
  lines.push("  related_files = excluded.related_files,");
  lines.push("  order_index = excluded.order_index;");
  lines.push("");

  return lines.join("\n");
}

function main() {
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  const startIndex = schema.indexOf(SEED_START);
  const endIndex = schema.indexOf(SEED_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("schema.sql에서 시드 구간 마커를 찾지 못했습니다.");
  }

  const nextSchema =
    schema.slice(0, startIndex) + buildSeedSql() + "\n" + schema.slice(endIndex);

  writeFileSync(SCHEMA_PATH, nextSchema);
  console.log(
    `Updated ${SCHEMA_PATH} (${curatedProblemSets.length} sets, ${curatedProblemSets.length * 3} questions).`
  );
}

main();
