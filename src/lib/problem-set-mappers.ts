import { curatedProblemSets, getCuratedCreatedAt } from "@/data/curated-problem-sets";
import type {
  GitHubDiffFile,
  ProblemQuestion,
  ProblemSetDetail,
  ProblemSetSummary,
  QuestionTag,
} from "@/lib/types";

type DbProblemSet = {
  id: string;
  source_type: "CURATED" | "GENERATED";
  visibility: "PUBLIC" | "PRIVATE";
  display_title: string;
  summary: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimated_minutes: number | null;
  language_tags: string[] | null;
  framework_tags: string[] | null;
  library_tags: string[] | null;
  topic_tags: string[] | null;
  pr_url: string;
  pr_title: string;
  repository_owner: string;
  repository_name: string;
  pull_number: number;
  base_branch: string | null;
  head_branch: string | null;
  raw_ai_response: unknown;
  created_at: string;
};

type DbQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE";
  tag: QuestionTag;
  question: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  related_files: string[] | null;
  order_index: number;
};

function questionTypeTags(questions: { tag: QuestionTag }[]): QuestionTag[] {
  return Array.from(new Set(questions.map((question) => question.tag)));
}

function extractDiffFiles(raw: unknown): GitHubDiffFile[] {
  if (!raw || typeof raw !== "object") return [];
  const github = (raw as { github?: { files?: unknown } }).github;
  return Array.isArray(github?.files) ? (github.files as GitHubDiffFile[]) : [];
}

export function curatedToDetail(id: string, includeAnswers: boolean): ProblemSetDetail | null {
  const problemSet = curatedProblemSets.find((set) => set.id === id);
  if (!problemSet) return null;

  const questions: ProblemQuestion[] = problemSet.questions.map((question, index) => ({
    id: question.id,
    type: question.type,
    tag: question.tag,
    question: question.question,
    options: [...question.options],
    relatedFiles: [...question.relatedFiles],
    orderIndex: index,
    ...(includeAnswers
      ? { answer: question.answer, explanation: question.explanation }
      : {}),
  }));

  return {
    id: problemSet.id,
    sourceType: problemSet.sourceType,
    visibility: problemSet.visibility,
    displayTitle: problemSet.displayTitle,
    summary: problemSet.summary,
    difficulty: problemSet.difficulty,
    estimatedMinutes: 8,
    languageTags: [...problemSet.languageTags],
    frameworkTags: [...problemSet.frameworkTags],
    libraryTags: [...problemSet.libraryTags],
    topicTags: [...problemSet.topicTags],
    questionTypeTags: [...problemSet.primaryTags],
    repository: problemSet.repository,
    repositoryOwner: problemSet.repositoryOwner,
    repositoryName: problemSet.repositoryName,
    pullNumber: problemSet.pullNumber,
    prUrl: problemSet.sourceUrl,
    prTitle: problemSet.sourcePrTitle,
    baseBranch: null,
    headBranch: null,
    sourceFiles: [...problemSet.sourceFiles],
    sourcePatchUrl: problemSet.sourcePatchUrl,
    createdAt: getCuratedCreatedAt(problemSet.id),
    questions,
  };
}

export function curatedToSummaries(): ProblemSetSummary[] {
  return curatedProblemSets.map((set) => {
    const detail = curatedToDetail(set.id, false);
    if (!detail) throw new Error(`Missing curated problem set: ${set.id}`);
    return { ...detail, questionCount: set.questions.length };
  });
}

export function dbToDetail(
  problemSet: DbProblemSet,
  questions: DbQuestion[],
  includeAnswers: boolean
): ProblemSetDetail {
  const ordered = [...questions].sort((a, b) => a.order_index - b.order_index);
  const diffFiles = extractDiffFiles(problemSet.raw_ai_response);
  const sourceFiles =
    diffFiles.length > 0
      ? diffFiles.map((file) => file.filename)
      : Array.from(new Set(ordered.flatMap((question) => question.related_files ?? [])));

  return {
    id: problemSet.id,
    sourceType: problemSet.source_type,
    visibility: problemSet.visibility,
    displayTitle: problemSet.display_title,
    summary: problemSet.summary,
    difficulty: problemSet.difficulty,
    estimatedMinutes: problemSet.estimated_minutes ?? 8,
    languageTags: problemSet.language_tags ?? [],
    frameworkTags: problemSet.framework_tags ?? [],
    libraryTags: problemSet.library_tags ?? [],
    topicTags: problemSet.topic_tags ?? [],
    questionTypeTags: questionTypeTags(ordered),
    repository: `${problemSet.repository_owner}/${problemSet.repository_name}`,
    repositoryOwner: problemSet.repository_owner,
    repositoryName: problemSet.repository_name,
    pullNumber: problemSet.pull_number,
    prUrl: problemSet.pr_url,
    prTitle: problemSet.pr_title,
    baseBranch: problemSet.base_branch,
    headBranch: problemSet.head_branch,
    sourceFiles,
    sourcePatchUrl: `${problemSet.pr_url}.patch`,
    diffFiles,
    createdAt: problemSet.created_at,
    questions: ordered.map((question) => ({
      id: question.id,
      type: question.type,
      tag: question.tag,
      question: question.question,
      options: question.options,
      relatedFiles: question.related_files ?? [],
      orderIndex: question.order_index,
      ...(includeAnswers
        ? { answer: question.answer, explanation: question.explanation }
        : {}),
    })),
  };
}

export function detailToSummary(detail: ProblemSetDetail): ProblemSetSummary {
  return {
    id: detail.id,
    sourceType: detail.sourceType,
    visibility: detail.visibility,
    displayTitle: detail.displayTitle,
    summary: detail.summary,
    difficulty: detail.difficulty,
    estimatedMinutes: detail.estimatedMinutes,
    languageTags: detail.languageTags,
    frameworkTags: detail.frameworkTags,
    libraryTags: detail.libraryTags,
    topicTags: detail.topicTags,
    questionTypeTags: detail.questionTypeTags,
    repository: detail.repository,
    repositoryOwner: detail.repositoryOwner,
    repositoryName: detail.repositoryName,
    pullNumber: detail.pullNumber,
    prUrl: detail.prUrl,
    prTitle: detail.prTitle,
    sourcePatchUrl: detail.sourcePatchUrl,
    createdAt: detail.createdAt,
    questionCount: detail.questions.length,
  };
}
