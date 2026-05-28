import { z } from "zod";
import { CollectedPullRequest } from "@/lib/server/github";

const questionTagSchema = z.enum([
  "CODE_BEHAVIOR",
  "DATA_FLOW",
  "STATE_CHANGE",
  "SIDE_EFFECT",
  "ERROR_HANDLING",
  "API_CONTRACT",
  "TEST_INTENT",
  "LOGIC_ERROR",
  "STRUCTURAL_CHANGE",
  "CONFIG_CHANGE",
]);

const answerSchema = z.enum(["A", "B", "C", "D"]);

export const generatedProblemSetSchema = z.object({
  displayTitle: z.string().min(1),
  summary: z.string().min(1),
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
        question: z.string().min(1),
        options: z.array(z.object({ id: answerSchema, text: z.string().min(1) })).length(4),
        answer: answerSchema,
        explanation: z.string().min(1),
        relatedFiles: z.array(z.string().min(1)).min(1).max(3),
      })
    )
    .length(3),
});

export type GeneratedProblemSet = z.infer<typeof generatedProblemSetSchema>;

const jsonSchema = {
  name: "generated_problem_set",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "displayTitle",
      "summary",
      "difficulty",
      "languageTags",
      "frameworkTags",
      "libraryTags",
      "topicTags",
      "questions",
    ],
    properties: {
      displayTitle: { type: "string" },
      summary: { type: "string" },
      difficulty: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
      languageTags: { type: "array", items: { type: "string" } },
      frameworkTags: { type: "array", items: { type: "string" } },
      libraryTags: { type: "array", items: { type: "string" } },
      topicTags: { type: "array", items: { type: "string" } },
      questions: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "tag", "question", "options", "answer", "explanation", "relatedFiles"],
          properties: {
            type: { type: "string", enum: ["MULTIPLE_CHOICE"] },
            tag: {
              type: "string",
              enum: [
                "CODE_BEHAVIOR",
                "DATA_FLOW",
                "STATE_CHANGE",
                "SIDE_EFFECT",
                "ERROR_HANDLING",
                "API_CONTRACT",
                "TEST_INTENT",
                "LOGIC_ERROR",
                "STRUCTURAL_CHANGE",
                "CONFIG_CHANGE",
              ],
            },
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
    "Create exactly 3 Korean multiple-choice questions from the GitHub PR diff.",
    "Use only facts from the diff. Do not infer beyond the patch.",
    "Generate the 3 best questions first, then assign the single best matching tag to each question.",
    "Also create displayTitle, summary, difficulty, languageTags, frameworkTags, libraryTags, and topicTags.",
    "displayTitle must be Korean and describe the learning topic. Do not copy the PR title.",
    "displayTitle and summary must not reveal the exact answer condition.",
    "Each question has A/B/C/D options and exactly one answer.",
    "Do not ask file-name-only questions.",
    "Explanation must be Korean and max 2 sentences.",
    "relatedFiles must include 1-3 paths from the diff.",
    "",
    `Repository: ${pr.owner}/${pr.repo}`,
    `Pull Request: #${pr.pullNumber} ${pr.title}`,
    `Description: ${pr.body}`,
    `Base branch: ${pr.baseBranch}`,
    `Head branch: ${pr.headBranch}`,
    `Changed files: ${pr.files.map((file) => file.filename).join(", ")}`,
    "",
    "Filtered diff:",
    pr.diffText,
  ].join("\n");
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

  const body = (await response.json()) as { output_text?: string; output?: unknown[] };
  const text =
    body.output_text ??
    JSON.stringify(body.output ?? "").match(/"text":"([\s\S]*)"/)?.[1];

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

  return generated;
}
