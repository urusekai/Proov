import { z } from "zod";
import { CollectedPullRequest } from "@/lib/server/github";

const questionTagSchema = z.enum([
  "CODE_BEHAVIOR",
  "DATA_FLOW",
  "STATE_CHANGE",
  "ERROR_HANDLING",
  "API_CONTRACT",
  "TEST_INTENT",
  "STRUCTURAL_CHANGE",
  "CONFIG_CHANGE",
]);

const answerSchema = z.enum(["A", "B", "C", "D"]);

export const generatedProblemSetSchema = z.object({
  displayTitle: z.string().min(1),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  languageTags: z.array(z.string().min(1)).min(1),
  frameworkTags: z.array(z.string().min(1)),
  libraryTags: z.array(z.string().min(1)),
  topicTags: z.array(z.string().min(1)),
  questions: z
    .array(
      z.object({
        type: z.literal("MULTIPLE_CHOICE"),
        tag: questionTagSchema,
        difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
        title: z.string().min(1),
        question: z.string().min(1),
        options: z.array(z.object({ id: answerSchema, text: z.string().min(1) })).length(4),
        answer: answerSchema,
        explanation: z.string().min(1),
        relatedFiles: z.array(z.string().min(1)).min(1).max(3),
      })
    )
    .min(1)
    .max(3),
});

export type GeneratedProblemSet = z.infer<typeof generatedProblemSetSchema>;

const jsonSchema = {
  name: "generated_problem_set",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "displayTitle",
      "difficulty",
      "languageTags",
      "frameworkTags",
      "libraryTags",
      "topicTags",
      "questions",
    ],
    properties: {
      displayTitle: { type: "string" },
      difficulty: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
      languageTags: { type: "array", items: { type: "string" } },
      frameworkTags: { type: "array", items: { type: "string" } },
      libraryTags: { type: "array", items: { type: "string" } },
      topicTags: { type: "array", items: { type: "string" } },
      questions: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "tag", "difficulty", "title", "question", "options", "answer", "explanation", "relatedFiles"],
          properties: {
            type: { type: "string", enum: ["MULTIPLE_CHOICE"] },
            tag: {
              type: "string",
              enum: [
                "CODE_BEHAVIOR",
                "DATA_FLOW",
                "STATE_CHANGE",
                "ERROR_HANDLING",
                "API_CONTRACT",
                "TEST_INTENT",
                "STRUCTURAL_CHANGE",
                "CONFIG_CHANGE",
              ],
            },
            difficulty: {
              type: "string",
              enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
            },
            title: { type: "string" },
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "text"],
                properties: {
                  id: { type: "string", enum: ["A", "B", "C", "D"] },
                  text: { type: "string" },
                },
              },
            },
            answer: { type: "string", enum: ["A", "B", "C", "D"] },
            explanation: { type: "string" },
            relatedFiles: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
  strict: true,
};

function buildPrompt(pr: CollectedPullRequest): string {
  return [
    "Create 1 to 3 Korean multiple-choice questions from the GitHub PR diff. Generate as many as the diff genuinely supports — prefer 3 if rich, fewer only when fewer distinct learning points exist.",
    "Use only facts from the diff.",
    "Generate the best questions first, then assign the most fitting tag to each.",
    "Assign difficulty per question based on cognitive effort:",
    "BEGINNER: answer is explicitly present in the changed lines.",
    "INTERMEDIATE: requires interpreting intent, comparing before/after, or following 1-2 steps of data/control flow.",
    "ADVANCED: requires reasoning about non-obvious consequences — edge cases, failure modes, implicit side effects, or impact on code not shown in the diff.",
    "For each question, create a short Korean title (noun phrase or noun clause using ~되는/~하는/~할 때의, NOT a full question, must NOT reveal the answer) that helps a list-browsing user understand what concept they will learn. Use well-known API/framework names (useEffect, fetch, parseJson, Response, URLSearchParams) when relevant; for project-internal function names, describe the concept instead. Examples — prefer these: '한 곡 반복 재생 시 재생 위치가 초기화되는 상태 조합' / '서버 세션 없을 때 리다이렉트 전에 추가되는 처리' / '`useEffect` 의존성 배열 변경 시 실행 타이밍이 달라지는 조건' / '로그아웃 후 초기화되는 스토어와 브라우저 저장값 범위' / '소셜 로그인 중복 계정 오류 시 만들어지는 redirect 결과' — over these: 'replayCurrentTrack() 상태 조합' / 'hasServerSession() 실패 처리' / 'useEffect deps 차이' / 'resetAllUserState 초기화 대상' / 'MongoError code 11000 처리'. Avoid generic labels like '변경된 코드 분석' or '함수 동작 이해'.",
    "Set top-level difficulty to any valid value — it will be recalculated from question difficulties.",
    "displayTitle must be Korean, describe the learning topic, not copy the PR title, and not reveal answer conditions.",
    "Do not ask file-name-only questions.",
    "For small diffs, look for questions about code behavior, data flow, state changes, API shape, error handling, tests, config or constants, or structure changes.",
    "Explanation must be Korean and max 2 sentences.",
    "relatedFiles must include 1-3 paths from the diff.",
    "",
    `Repository: ${pr.owner}/${pr.repo}`,
    `Pull Request: #${pr.pullNumber} ${pr.title}`,
    ...(pr.body ? [`Description: ${pr.body}`] : []),
    `Changed files: ${pr.files.map((file) => file.filename).join(", ")}`,
    "",
    "Filtered diff:",
    pr.diffText,
  ].join("\n");
}

const DIFFICULTY_ORDER = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 } as const;
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

function calcRepresentativeDifficulty(difficulties: Difficulty[]): Difficulty {
  const sorted = [...difficulties].sort((a, b) => DIFFICULTY_ORDER[a] - DIFFICULTY_ORDER[b]);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function generateProblemSetFromPr(pr: CollectedPullRequest): Promise<GeneratedProblemSet> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OpenAI API key is missing."), { code: "OPENAI_NOT_CONFIGURED" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4",
      input: buildPrompt(pr),
      text: {
        format: {
          type: "json_schema",
          ...jsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw Object.assign(new Error(`OpenAI request failed: ${detail}`), { code: "OPENAI_FAILED" });
  }

  type OutputContent = { type: string; text?: string };
  type OutputItem = { content?: OutputContent[] };
  const body = (await response.json()) as { output_text?: string; output?: OutputItem[] };

  const text =
    body.output_text ??
    (body.output ?? [])
      .flatMap((item) => item.content ?? [])
      .find((c) => c.type === "output_text")
      ?.text;

  if (!text) {
    throw Object.assign(new Error("OpenAI returned no JSON text."), { code: "AI_EMPTY_RESPONSE" });
  }

  const parsedJson = JSON.parse(text);
  const generated = generatedProblemSetSchema.parse(parsedJson);
  const fileNames = new Set(pr.files.map((file) => file.filename));

  for (const question of generated.questions) {
    const hasInvalidFile = question.relatedFiles.some((file) => !fileNames.has(file));
    if (hasInvalidFile) {
      throw Object.assign(new Error("AI referenced a file outside the filtered diff."), {
        code: "AI_INVALID_RELATED_FILE",
      });
    }
  }

  const representativeDifficulty = calcRepresentativeDifficulty(
    generated.questions.map((q) => q.difficulty)
  );

  return { ...generated, difficulty: representativeDifficulty };
}
