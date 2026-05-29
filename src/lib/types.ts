export type QuestionTag =
  | "CODE_BEHAVIOR"
  | "DATA_FLOW"
  | "STATE_CHANGE"
  | "ERROR_HANDLING"
  | "API_CONTRACT"
  | "TEST_INTENT"
  | "STRUCTURAL_CHANGE"
  | "CONFIG_CHANGE";

export type ProblemSetDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type QuestionDifficulty = ProblemSetDifficulty;
export type AnswerId = "A" | "B" | "C" | "D";
export type SubmissionScore = 0 | 33 | 67 | 100;

export type ProblemOption = {
  id: AnswerId;
  text: string;
};

export type ProblemQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE";
  tag: QuestionTag;
  difficulty: QuestionDifficulty;
  title: string;
  question: string;
  options: ProblemOption[];
  relatedFiles: string[];
  orderIndex: number;
  answer?: AnswerId;
  explanation?: string;
};

export type ProblemSetDetail = {
  id: string;
  sourceType: "CURATED" | "GENERATED";
  visibility: "PUBLIC" | "PRIVATE";
  displayTitle: string;
  difficulty: ProblemSetDifficulty;
  estimatedMinutes: number;
  languageTags: string[];
  frameworkTags: string[];
  libraryTags: string[];
  topicTags: string[];
  questionTypeTags: QuestionTag[];
  repository: string;
  repositoryOwner: string;
  repositoryName: string;
  pullNumber: number;
  prUrl: string;
  prTitle: string;
  baseBranch: string | null;
  headBranch: string | null;
  sourceFiles: string[];
  sourcePatchUrl?: string;
  diffFiles?: GitHubDiffFile[];
  createdAt: string;
  questions: ProblemQuestion[];
};

export type ProblemSetSummary = Omit<
  ProblemSetDetail,
  "questions" | "diffFiles" | "sourceFiles" | "baseBranch" | "headBranch"
> & {
  questionCount: number;
};

export type ProblemQuestionSummary = {
  id: string;
  problemSetId: string;
  sourceType: "CURATED" | "GENERATED";
  visibility: "PUBLIC" | "PRIVATE";
  displayTitle: string;
  title: string;
  question: string;
  tag: QuestionTag;
  difficulty: QuestionDifficulty;
  estimatedMinutes: number;
  languageTags: string[];
  frameworkTags: string[];
  libraryTags: string[];
  topicTags: string[];
  repository: string;
  repositoryOwner: string;
  repositoryName: string;
  pullNumber: number;
  prUrl: string;
  prTitle: string;
  sourcePatchUrl?: string;
  relatedFiles: string[];
  orderIndex: number;
  createdAt: string;
  submissionCount: number;
};

export type GitHubDiffFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type SubmissionAnswerResult = {
  questionId: string;
  selectedAnswer: AnswerId;
  correctAnswer: AnswerId;
  isCorrect: boolean;
  tag: QuestionTag;
  difficulty: QuestionDifficulty;
  title: string;
  question: string;
  options: ProblemOption[];
  explanation: string;
  relatedFiles: string[];
};

export type SubmissionResult = {
  id: string | null;
  problemSet: ProblemSetDetail;
  score: SubmissionScore;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
  saved: boolean;
  answers: SubmissionAnswerResult[];
};

export type SubmissionListItemData = {
  id: string;
  problemSetId: string;
  displayTitle: string;
  repository: string;
  repositoryOwner: string;
  repositoryName: string;
  pullNumber: number;
  sourcePrTitle: string;
  sourceUrl: string;
  difficulty: ProblemSetDifficulty;
  score: SubmissionScore;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
  answers: SubmissionAnswerResult[];
};
