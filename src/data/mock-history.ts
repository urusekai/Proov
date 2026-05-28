import { curatedProblemSets, QuestionTag } from "./curated-problem-sets";

export type MockSubmissionAnswer = {
  questionId: string;
  selected: "A" | "B" | "C" | "D";
  correct: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  tag: QuestionTag;
  question: string;
  explanation: string;
  relatedFiles: string[];
};

export type MockSubmission = {
  id: string;
  problemSetId: string;
  displayTitle: string;
  repository: string;
  repositoryOwner: string;
  repositoryName: string;
  pullNumber: number;
  sourcePrTitle: string;
  sourceUrl: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  score: 0 | 33 | 67 | 100;
  correctCount: number;
  submittedAt: string;
  answers: MockSubmissionAnswer[];
};

const submissionSeeds = [
  {
    id: "sub-001",
    problemSetId: "hono-ipv6-string-formatting",
    selected: ["B", "D", "B"],
    submittedAt: "2026-05-26",
  },
  {
    id: "sub-002",
    problemSetId: "zustand-devtools-type-declaration",
    selected: ["B", "C", "C"],
    submittedAt: "2026-05-25",
  },
  {
    id: "sub-003",
    problemSetId: "react-hook-form-bulk-value-notification",
    selected: ["A", "C", "D"],
    submittedAt: "2026-05-24",
  },
  {
    id: "sub-004",
    problemSetId: "fastify-reply-trailer-completion",
    selected: ["A", "A", "C"],
    submittedAt: "2026-05-23",
  },
  {
    id: "sub-005",
    problemSetId: "zod-cidrv6-schema-pattern",
    selected: ["A", "B", "B"],
    submittedAt: "2026-05-22",
  },
] as const;

function toScore(correctCount: number): 0 | 33 | 67 | 100 {
  if (correctCount === 3) return 100;
  if (correctCount === 2) return 67;
  if (correctCount === 1) return 33;
  return 0;
}

export const mockSubmissions: MockSubmission[] = submissionSeeds.map((seed) => {
  const problemSet = curatedProblemSets.find((set) => set.id === seed.problemSetId);

  if (!problemSet) {
    throw new Error(`Missing curated problem set: ${seed.problemSetId}`);
  }

  const answers = problemSet.questions.map((question, index) => {
    const selected = seed.selected[index];

    return {
      questionId: question.id,
      selected,
      correct: question.answer,
      isCorrect: selected === question.answer,
      tag: question.tag,
      question: question.question,
      explanation: question.explanation,
      relatedFiles: [...question.relatedFiles],
    };
  });

  const correctCount = answers.filter((answer) => answer.isCorrect).length;

  return {
    id: seed.id,
    problemSetId: problemSet.id,
    displayTitle: problemSet.displayTitle,
    repository: problemSet.repository,
    repositoryOwner: problemSet.repositoryOwner,
    repositoryName: problemSet.repositoryName,
    pullNumber: problemSet.pullNumber,
    sourcePrTitle: problemSet.sourcePrTitle,
    sourceUrl: problemSet.sourceUrl,
    difficulty: problemSet.difficulty,
    score: toScore(correctCount),
    correctCount,
    submittedAt: seed.submittedAt,
    answers,
  };
});
