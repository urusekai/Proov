"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Menu,
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  BookOpen,
  ExternalLink,
  GitPullRequest
} from "lucide-react";

// Proov SVG Logo Component
const ProovLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.2969 18.5801C12.7563 19.7463 12.4531 21.045 12.4531 22.415C12.4531 27.4585 16.5415 31.5469 21.585 31.5469C22.9548 31.5469 24.2528 31.2426 25.4189 30.7021L38.3613 43.6445C37.6149 43.8748 36.8221 44 36 44H8C3.58172 44 1.28855e-07 40.4183 0 36V8C2.3982e-08 7.17769 0.124055 6.38435 0.354492 5.6377L13.2969 18.5801ZM36 0C40.4183 1.28851e-07 44 3.58172 44 8V36C44 36.8221 43.8748 37.6149 43.6445 38.3613L30.3301 25.0469C30.5806 24.2134 30.7168 23.3302 30.7168 22.415C30.7168 17.3716 26.6284 13.2832 21.585 13.2832C20.6696 13.2832 19.7859 13.4183 18.9521 13.6689L5.6377 0.354492C6.38435 0.124055 7.17769 2.39812e-08 8 0H36Z"
      fill="currentColor"
    />
  </svg>
);

type QuestionTag =
  | "CODE_BEHAVIOR"
  | "DATA_FLOW"
  | "STATE_CHANGE"
  | "SIDE_EFFECT"
  | "ERROR_HANDLING"
  | "API_CONTRACT"
  | "TEST_INTENT"
  | "LOGIC_ERROR"
  | "STRUCTURAL_CHANGE"
  | "CONFIG_CHANGE";

interface Question {
  type: "MULTIPLE_CHOICE";
  tag: QuestionTag;
  question: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  relatedFiles: string[];
  diffText: string; // Associated git diff code block
}

const TAG_LABELS: Record<QuestionTag, string> = {
  CODE_BEHAVIOR: "Code Behavior",
  DATA_FLOW: "Data Flow",
  STATE_CHANGE: "State Change",
  SIDE_EFFECT: "Side Effect",
  ERROR_HANDLING: "Error Handling",
  API_CONTRACT: "API Contract",
  TEST_INTENT: "Test Intent",
  LOGIC_ERROR: "Logic Error",
  STRUCTURAL_CHANGE: "Structural Change",
  CONFIG_CHANGE: "Config Change",
};

// Precise high-fidelity Git diff mock data representing API client modifications
const MOCK_QUESTIONS: Question[] = [
  {
    type: "MULTIPLE_CHOICE",
    tag: "ERROR_HANDLING",
    question: "변경된 API 클라이언트 코드에서 재시도(Retry)가 발생하는 HTTP 상태 코드(Status Code)의 조건으로 가장 적절한 것은 무엇입니까?",
    options: [
      { id: "A", text: "400 Bad Request를 포함한 모든 API 에러 발생 시" },
      { id: "B", text: "401 Unauthorized 및 403 Forbidden 권한 에러 발생 시" },
      { id: "C", text: "5xx 서버 에러 및 네트워크 연결 타임아웃(408) 발생 시" },
      { id: "D", text: "3xx 클라이언트 리다이렉션 응답을 전달받았을 때" }
    ],
    answer: "C",
    explanation: "클라이언트 코드의 isRetryable 함수는 500 이상의 서버 에러 코드 및 연결 타임아웃 에러(408)에 대해서만 재시도를 수행하도록 조건 분기가 설정되었습니다. 4xx대 클라이언트 원인 에러는 재시도 대상에서 완전히 제외됩니다.",
    relatedFiles: ["src/utils/apiClient.ts"],
    diffText: `@@ -12,8 +12,18 @@ export async function request<T>(config: RequestConfig): Promise<T> {
-  const response = await fetch(config.url, config);
-  if (!response.ok) {
-    throw new Error(\`HTTP error! status: \${response.status}\`);
-  }
-  return response.json();
+  let retryCount = 0;
+  while (true) {
+    try {
+      const response = await fetch(config.url, config);
+      if (response.ok) {
+        return response.json();
+      }
+      
+      if (!isRetryable(response.status) || retryCount >= MAX_RETRIES) {
+        throw new HttpError(response.status, response.statusText);
+      }
+      
+      retryCount++;
+      await sleep(getBackoffDelay(retryCount));
@@ -35,3 +45,7 @@
+function isRetryable(status: number): boolean {
+  // 5xx Server Errors and connection timeouts (408) are retryable
+  return status >= 500 || status === 408;
+}`
  },
   {
     type: "MULTIPLE_CHOICE",
    tag: "DATA_FLOW",
    question: "지수 백오프 계산 시, 2번째 재시도(시도 횟수 retryCount = 2)에서 대기하는 지연 시간(Delay Time)은 기본 대기 시간(baseDelay = 1000ms)을 기준으로 어떻게 계산됩니까? (단, 지터는 고려하지 않음)",
    options: [
      { id: "A", text: "1000ms (1초)" },
      { id: "B", text: "2000ms (2초)" },
      { id: "C", text: "4000ms (4초)" },
      { id: "D", text: "8000ms (8초)" }
    ],
    answer: "C",
    explanation: "코드에 적용된 연산 수식은 baseDelay * Math.pow(2, retryCount) 입니다. 따라서 2번째 재시도 시에는 1000 * 2^2 = 4000ms가 대기 시간으로 정확히 적용됩니다.",
    relatedFiles: ["src/utils/backoff.ts", "src/utils/apiClient.ts"],
    diffText: `diff --git a/src/utils/backoff.ts b/src/utils/backoff.ts
new file mode 100644
@@ -0,0 +1,10 @@
+export const BASE_DELAY = 1000; // 1 second
+
+/**
+ * Calculates exponential backoff delay time
+ * delay = baseDelay * 2^retryCount
+ */
+export function getBackoffDelay(retryCount: number): number {
+  const delay = BASE_DELAY * Math.pow(2, retryCount);
+  return delay;
+}
diff --git a/src/utils/apiClient.ts b/src/utils/apiClient.ts
@@ -1,6 +1,7 @@
 import { HttpError } from "./errors";
+import { getBackoffDelay } from "./backoff";
 
 export async function request<T>(config: RequestConfig): Promise<T> {
   let retryCount = 0;
@@ -24,7 +25,7 @@ export async function request<T>(config: RequestConfig): Promise<T> {
 
       retryCount++;
-      await sleep(1000);
+      await sleep(getBackoffDelay(retryCount));
     }`
  },
   {
     type: "MULTIPLE_CHOICE",
    tag: "SIDE_EFFECT",
    question: "이번 PR에서 도입된 최대 재시도 횟수 제한(MAX_RETRIES = 3)을 초과하여 재시도가 모두 실패할 경우, 최종적으로 API 클라이언트가 수행하는 동작은 무엇입니까?",
    options: [
      { id: "A", text: "경고 로그만 파일에 적재하고, 호출부에는 빈 객체({})를 반환한다." },
      { id: "B", text: "에러 객체를 생성하여 상위 호출 스택으로 예외(throw)를 최종 전파한다." },
      { id: "C", text: "성공할 때까지 무한 대기 상태로 재접속 루프를 실행한다." },
      { id: "D", text: "이전 서버 통신에서 로컬 캐시(Cache)에 저장해 둔 백업 데이터를 반환한다." }
    ],
    answer: "B",
    explanation: "최대 재시도 횟수를 초과하는 경우 throw new MaxRetriesExceededError()를 실행하여 호출부로 최종 예외를 전파시킵니다. 이를 통해 UI 레이어에서 적절한 에러 팝업이나 토스트를 보여줄 수 있습니다.",
    relatedFiles: ["src/utils/apiClient.ts"],
    diffText: `@@ -28,5 +38,7 @@
-      if (!isRetryable(response.status) || retryCount >= MAX_RETRIES) {
-        throw new HttpError(response.status, response.statusText);
-      }
+      if (!isRetryable(response.status) || retryCount >= MAX_RETRIES) {
+        if (retryCount >= MAX_RETRIES) {
+          throw new MaxRetriesExceededError("Maximum API retry attempts reached.");
+        }
+        throw new HttpError(response.status, response.statusText);
+      }`
  }
];

// Light Git diff viewer
const DiffViewer = ({ diffText }: { diffText: string }) => {
  const lines = diffText
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim();
      return (
        !trimmedLine.startsWith("diff --git ") &&
        !trimmedLine.startsWith("new file mode ") &&
        !trimmedLine.startsWith("deleted file mode ") &&
        !trimmedLine.startsWith("index ") &&
        !trimmedLine.startsWith("--- ") &&
        !trimmedLine.startsWith("+++ ")
      );
    });

  return (
    <div className="scrollbar-thin font-mono text-xs overflow-auto bg-white text-slate-700 leading-relaxed h-full">
      {lines.map((line, idx) => {
        let bgClass = "bg-white text-slate-700";
        if (line.startsWith("+")) {
          bgClass = "bg-emerald-50 text-emerald-800";
        } else if (line.startsWith("-")) {
          bgClass = "bg-rose-50 text-rose-800";
        } else if (line.startsWith("@@")) {
          bgClass = "bg-lavender-tint/35 text-primary font-semibold";
        }
        return (
          <div key={idx} className={`py-0.5 px-3 font-mono whitespace-pre flex min-w-max ${bgClass}`}>
            <span className="inline-block w-8 text-slate-400 select-none mr-3 text-right text-[11px] shrink-0">{idx + 1}</span>
            <span className="font-mono pr-4">{line}</span>
          </div>
        );
      })}
    </div>
  );
};

const getDiffTextForFile = (question: Question, file: string) => {
  const chunks = question.diffText.trim().split(/\n(?=diff --git a\/)/g);
  const matchedChunk = chunks.find(
    (chunk) => chunk.startsWith(`diff --git a/${file} `) || chunk.includes(` b/${file}`)
  );

  if (matchedChunk) return matchedChunk;
  return question.diffText;
};

export default function Practice() {
  const [step, setStep] = useState<"INPUT" | "LOADING" | "PRACTICE" | "RESULT">("INPUT");
  const [prUrl, setPrUrl] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedDiffFile, setSelectedDiffFile] = useState(MOCK_QUESTIONS[0].relatedFiles[0]);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [score, setScore] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Read query parameter on mount to auto-start if URL is provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      if (urlParam) {
        setTimeout(() => {
          setPrUrl(urlParam);
          setStep("LOADING");
          setLoadingStep(0);
        }, 0);
      }
    }
  }, []);

  // Steps shown in the premium loading phase
  const loadingPhases = [
    "GitHub Repository 정보 및 PR 메타데이터 수집 중...",
    "변경된 소스코드 Diff 필터링 및 불필요한 바이너리 파일 정제 중...",
    "OpenAI GPT-5.4 기반 코드 변경 의도 및 구조적 맥락 분석 중...",
    "변별력 있는 핵심 코드 이해력 평가 객관식 3문항 출제 중...",
    "Zod 스키마 검사 및 문제 정합성 유효성 최종 검증 완료!"
  ];

  // Handle URL submit to start loading state
  const handleStartPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl) return;
    setAnswers({});
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedDiffFile(MOCK_QUESTIONS[0].relatedFiles[0]);
    setStep("LOADING");
    setLoadingStep(0);
  };

  // Simulate loading stages sequentially
  useEffect(() => {
    if (step !== "LOADING") return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingPhases.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setStep("PRACTICE");
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [step, loadingPhases.length]);

  // Handle option select in practice view
  const handleSelectOption = (optionId: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionId,
    }));
  };

  const moveToQuestion = (nextIndex: number) => {
    setCurrentQuestionIndex(nextIndex);
    setSelectedDiffFile(MOCK_QUESTIONS[nextIndex].relatedFiles[0]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scoring function
  const handleSubmitAnswers = () => {
    let correctCount = 0;
    MOCK_QUESTIONS.forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        correctCount += 1;
      }
    });

    // Score conversion (1: 33, 2: 67, 3: 100)
    let finalScore = 0;
    if (correctCount === 1) finalScore = 33;
    else if (correctCount === 2) finalScore = 67;
    else if (correctCount === 3) finalScore = 100;

    setScore(finalScore);
    setStep("RESULT");
  };

  // Render URL input step
  const renderInputStep = () => (
    <div className="w-full max-w-2xl mx-auto py-16 px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GitHub PR 기반 즉석 테스트</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text mb-4">
          새로운 코드 독해 연습 시작
        </h1>
        <p className="text-base text-muted-text">
          분석하고 싶은 공개 GitHub Pull Request URL을 입력해주세요.<br />
          AI가 코드 변경의 핵심 의도를 짚는 3개의 문제를 자동 출제합니다.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-8">
        <form onSubmit={handleStartPractice} className="space-y-6">
          <div>
            <label htmlFor="pr-url" className="block text-sm font-semibold text-text mb-2">
              GitHub Pull Request URL
            </label>
            <div className="bg-white rounded-xl border border-lavender-tint focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-highlight transition-all">
              <input
                id="pr-url"
                type="url"
                required
                placeholder="예: https://github.com/openai/proov-demo/pull/42"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                className="w-full px-5 py-4 text-sm md:text-base text-text bg-transparent placeholder-muted-text/60 border-none outline-none focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!prUrl}
            className="w-full bg-accent text-white py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-primary transition-all active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>분석 및 문제 생성 시작</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  // Render loading step
  const renderLoadingStep = () => (
    <div className="w-full max-w-[1248px] mx-auto py-12 px-4 md:px-6">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-stretch">
        <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="relative mb-8 w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-lavender-tint border-t-accent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-text mb-3">
              AI가 Pull Request 분석 중
            </h2>
            <p className="text-sm text-muted-text leading-relaxed max-w-md">
              공개 PR의 메타데이터와 변경 파일을 수집하고, 제한 정책에 맞게 diff를 정제한 뒤 객관식 3문항을 생성합니다.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-lavender-tint bg-background/60 p-4">
              <p className="text-[11px] font-bold text-muted-text mb-1">Repository</p>
              <p className="font-mono text-sm font-bold text-accent truncate">openai/proov-demo</p>
            </div>
            <div className="rounded-lg border border-lavender-tint bg-background/60 p-4">
              <p className="text-[11px] font-bold text-muted-text mb-1">Questions</p>
              <p className="text-sm font-bold text-text">객관식 3문항</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-text">처리 단계</h3>
              <p className="text-sm text-muted-text mt-1">OpenAI 호출 전 diff 제한과 스키마 검증까지 순서대로 처리합니다.</p>
            </div>
            <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
              {Math.min(loadingStep + 1, loadingPhases.length)} / {loadingPhases.length}
            </span>
          </div>

          <div className="space-y-4">
            {loadingPhases.map((phase, idx) => {
              const isCompleted = idx < loadingStep;
              const isCurrent = idx === loadingStep;

              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-300 ${
                    isCompleted 
                      ? "bg-emerald-50/50 border-emerald-100/60 text-emerald-800" 
                      : isCurrent 
                        ? "bg-accent/5 border-accent/20 text-accent font-semibold shadow-sm"
                        : "bg-transparent border-transparent text-muted-text/60"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50/20" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-lavender-tint/80 flex items-center justify-center text-[10px] font-mono select-none">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <span className="text-xs md:text-sm leading-relaxed">{phase}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Render practice step
  const renderPracticeStep = () => {
    const q = MOCK_QUESTIONS[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestionIndex];
    const isCompletedAll = Object.keys(answers).length === MOCK_QUESTIONS.length;
    const diffFiles = q.relatedFiles;
    const activeDiffFile = diffFiles.includes(selectedDiffFile) ? selectedDiffFile : diffFiles[0];
    const activeDiffText = getDiffTextForFile(q, activeDiffFile);

    // Fallback safe PR external url logic
    const finalPrUrl = prUrl.startsWith("http") ? prUrl : "https://github.com/openai/proov-demo/pull/42";

    return (
      <div className="w-full max-w-none mx-auto px-4 py-4 md:px-6 xl:px-8 2xl:px-10 flex flex-col gap-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
        
        {/* Top Header Row: Repository name, PR Title, and Actual PR button */}
        <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-accent">openai/proov-demo</span>
                <span className="font-mono bg-lavender-tint text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  main ⇠ patch-retry
                </span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-text truncate max-w-[320px] md:max-w-[480px]" title="Improve retry logic in API client">
                Improve retry logic in API client
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-none pt-3 sm:pt-0 shrink-0">
            {/* Go to Actual PR Button */}
            <a 
              href={finalPrUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-2 bg-white text-accent border border-lavender-tint hover:border-accent hover:bg-accent/5 text-xs md:text-sm font-bold px-4 py-2.5 rounded-lg transition-colors active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <span>실제 GitHub PR 이동</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link 
              href="/"
              className="inline-flex items-center justify-center text-xs md:text-sm font-bold border border-lavender-tint text-muted-text hover:text-text hover:bg-lavender-tint/20 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              연습 중단
            </Link>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] 2xl:grid-cols-[minmax(0,1fr)_500px] gap-6 w-full items-start xl:items-stretch xl:flex-1 xl:min-h-0">
          
          {/* LEFT PANEL: Git Diff Code Viewer */}
          <section className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden flex flex-col min-w-0 xl:h-full xl:min-h-0">
            <div className="border-b border-lavender-tint px-4 py-3">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="변경 파일 diff">
                {diffFiles.map((file) => {
                  const isSelected = file === activeDiffFile;

                  return (
                    <button
                      key={file}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedDiffFile(file)}
                      className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        isSelected
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-slate-50 border-slate-200 text-muted-text hover:bg-lavender-tint/30 hover:text-text"
                      }`}
                    >
                      {file}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 xl:flex-1 xl:min-h-0">
              <DiffViewer diffText={activeDiffText} />
            </div>
          </section>

          {/* RIGHT PANEL: Question Solver */}
          <aside className="bg-white rounded-xl border border-lavender-tint shadow-default p-5 md:p-6 min-w-0 xl:h-full xl:min-h-0 xl:overflow-hidden flex flex-col">
            <div className="xl:flex-1 xl:min-h-0">
              <div className="grid grid-cols-3 gap-2 mb-7" aria-label="문제 진행률">
                {MOCK_QUESTIONS.map((_, idx) => {
                  const isSelected = idx === currentQuestionIndex;
                  const isAnswered = answers[idx] !== undefined;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => moveToQuestion(idx)}
                      aria-label={`문제 ${idx + 1}로 이동`}
                      className={`h-2.5 rounded-full transition-colors ${
                        isSelected
                          ? "bg-accent"
                          : isAnswered
                            ? "bg-accent/35"
                            : "bg-lavender-tint"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center bg-accent/10 text-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {TAG_LABELS[q.tag]}
                </span>
              </div>

              <h2 className="text-base md:text-lg font-bold text-text leading-relaxed mb-6 flex items-start gap-2">
                <span className="text-accent font-extrabold select-none shrink-0">Q{currentQuestionIndex + 1}.</span>
                <span>{q.question}</span>
              </h2>

              <div className="space-y-3">
                {q.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors duration-200 flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-accent/5 border-accent text-text"
                          : "bg-white border-lavender-tint hover:bg-lavender-tint/20 hover:border-lavender-tint text-text"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5.5 h-5.5 rounded-md font-bold text-[11px] flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "bg-accent border-accent text-white"
                          : "bg-slate-50 border-lavender-tint text-muted-text"
                      }`}>
                        {option.id}
                      </div>
                      <span className="text-xs md:text-sm leading-relaxed">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 xl:mt-0 xl:pt-5 xl:shrink-0 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveToQuestion(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-muted-text hover:text-text px-3 py-2.5 border border-lavender-tint rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>이전</span>
                </button>

                <button
                  onClick={() => moveToQuestion(Math.min(MOCK_QUESTIONS.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === MOCK_QUESTIONS.length - 1}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-muted-text hover:text-text px-3 py-2.5 border border-lavender-tint rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>다음</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSubmitAnswers}
                disabled={!isCompletedAll}
                className="w-full bg-accent text-white py-2.5 rounded-lg text-xs md:text-sm font-extrabold hover:bg-primary transition-all active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
              >
                답안 제출
              </button>
            </div>
          </aside>

        </div>

      </div>
    );
  };

  // Render result step
  const renderResultStep = () => {
    const correctCount = MOCK_QUESTIONS.filter((q, idx) => answers[idx] === q.answer).length;

    return (
      <div className="w-full max-w-[1248px] mx-auto py-10 px-4 md:px-6">
        {/* Score banner card */}
        <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-8 md:p-10 mb-8 relative overflow-hidden grid lg:grid-cols-[minmax(0,1fr)_280px] gap-8 items-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
          <div>
            <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Practice Completed</span>
            </div>

            <h2 className="text-xl font-bold text-muted-text mb-2">
              코드 이해력 테스트 점수
            </h2>
            <div className="my-4">
              <span className="text-6xl font-extrabold text-accent">{score}</span>
              <span className="text-2xl font-bold text-text/80">점</span>
            </div>

            <p className="text-sm text-muted-text max-w-2xl leading-relaxed">
              {score === 100 
                ? "완벽합니다! PR의 핵심 의도와 데이터 변경 흐름, 예외 처리 로직까지 완벽하게 소화하고 계십니다." 
                : score === 67 
                  ? "훌륭합니다! 전반적인 구조와 주요 비즈니스 흐름을 파악하고 있으며, 일부 미세한 사이드 이펙트나 예외 처리 조건을 확인해보세요."
                  : score === 33
                    ? "준수합니다. 변경된 코드의 로직 흐름과 예외 사항 처리에 대해 아래의 세부 분석 오답 해설지를 꼼꼼히 확인해보세요."
                    : "아쉽습니다. 코드의 세부 분기 동작 및 데이터 전달 구조에 대해 아래의 해설지와 변경 관련 파일들을 천천히 복기해보세요."
              }
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-lavender-tint bg-background/60 p-4">
              <p className="text-[11px] font-bold text-muted-text mb-1">정답</p>
              <p className="text-2xl font-extrabold text-text">{correctCount} / 3</p>
            </div>
            <div className="rounded-lg border border-lavender-tint bg-background/60 p-4">
              <p className="text-[11px] font-bold text-muted-text mb-1">기록 저장</p>
              <p className="text-sm font-bold text-muted-text">로그인 후 가능</p>
            </div>
          </div>
        </div>

        {/* Detailed Solutions Checklist */}
        <h3 className="text-base font-bold text-text mb-4 uppercase tracking-wider">
          문항별 세부 결과 분석
        </h3>

        <div className="space-y-6 mb-10">
          {MOCK_QUESTIONS.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.answer;

            return (
              <div 
                key={idx} 
                className={`bg-white rounded-xl border p-6 md:p-7 shadow-sm transition-all ${
                  isCorrect 
                    ? "border-emerald-200" 
                    : "border-rose-200"
                }`}
              >
                {/* Result header */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent">Q{idx + 1}</span>
                    <span className="inline-flex items-center bg-accent/10 text-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {TAG_LABELS[q.tag]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Check className="w-4 h-4 stroke-[3px]" />
                        <span>정답</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <X className="w-4 h-4 stroke-[3px]" />
                        <span>오답</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-stretch">
                  <div>
                    {/* Question */}
                    <h4 className="text-lg font-bold text-text leading-relaxed mb-5">
                      {q.question}
                    </h4>

                    {/* Options display with state */}
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isUserPick = userAnswer === option.id;
                        const isRightAnswer = q.answer === option.id;

                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border text-xs md:text-sm leading-relaxed flex items-start gap-3 transition-colors ${
                              isRightAnswer
                                ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                                : isUserPick
                                  ? "bg-rose-50 border-rose-200 text-rose-900 font-semibold"
                                  : "bg-white border-slate-100 text-muted-text/80"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center font-bold text-[10px] ${
                              isRightAnswer
                                ? "bg-emerald-500 text-white"
                                : isUserPick
                                  ? "bg-rose-500 text-white"
                                  : "bg-slate-100 text-muted-text"
                            }`}>
                              {option.id}
                            </div>
                            <span>
                              {option.text}
                              {isRightAnswer && " (정답)"}
                              {isUserPick && !isCorrect && " (내가 선택한 답 - 오답)"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-lavender-tint/25 rounded-lg p-5 text-sm leading-relaxed h-full">
                    <div className="flex items-center gap-1.5 text-accent font-bold mb-2 text-xs">
                      <BookOpen className="w-4 h-4" />
                      <span>AI 해설</span>
                    </div>
                    <p className="text-muted-text font-medium leading-relaxed mb-4">
                      {q.explanation}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">관련 파일:</span>
                      {q.relatedFiles.map((file, fIdx) => (
                        <span key={fIdx} className="font-mono text-[11px] font-bold bg-white text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Retry / Exit buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => {
              setPrUrl("");
              setStep("INPUT");
            }}
            className="w-full sm:w-auto bg-accent text-white px-8 py-3.5 rounded-xl text-sm md:text-base font-semibold hover:bg-primary transition-all active:scale-[0.98] text-center cursor-pointer shadow-sm"
          >
            다른 PR 연습하기
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto bg-white text-muted-text border border-lavender-tint px-8 py-3.5 rounded-xl text-sm md:text-base font-semibold hover:text-text hover:bg-slate-50 transition-all text-center"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className={step === "PRACTICE" ? "h-screen overflow-hidden flex flex-col font-sans selection:bg-accent/20 bg-background" : "min-h-screen flex flex-col font-sans selection:bg-accent/20 bg-background"}>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-lavender-tint">
        <div className="w-full max-w-none mx-auto px-4 md:px-6 xl:px-8 2xl:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity">
              <ProovLogo className="w-[18px] h-[18px] text-accent" />
              <span>Proov</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-text">
              <Link href="/" className="hover:text-accent transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform">
                새 풀이
              </Link>
              <Link href="/history" className="hover:text-accent transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform">
                풀이 기록
              </Link>
            </nav>
          </div>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-muted-text hover:text-text px-4 py-2 transition-colors">
              로그인
            </Link>
            <Link href="/auth/signup" className="text-sm font-medium bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-primary transition-all hover:shadow-default active:scale-[0.98]">
              회원가입
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-text hover:text-text hover:bg-lavender-tint/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-lavender-tint px-4 md:px-6 py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4 text-sm font-medium text-muted-text mb-6">
              <Link href="/" className="hover:text-accent py-1 transition-colors">새 풀이</Link>
              <Link href="/history" className="hover:text-accent py-1 transition-colors">풀이 기록</Link>
            </nav>
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" className="text-sm font-medium text-muted-text hover:text-text py-2.5 border border-lavender-tint rounded-lg transition-colors text-center">
                로그인
              </Link>
              <Link href="/auth/signup" className="text-sm font-medium bg-accent text-white py-2.5 rounded-lg hover:bg-primary transition-all text-center">
                회원가입
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className={step === "PRACTICE" ? "flex-1 min-h-0 overflow-auto xl:overflow-hidden" : "flex-grow flex items-center justify-center"}>
        {step === "INPUT" && renderInputStep()}
        {step === "LOADING" && renderLoadingStep()}
        {step === "PRACTICE" && renderPracticeStep()}
        {step === "RESULT" && renderResultStep()}
      </main>

      {/* Footer */}
      {step !== "PRACTICE" && (
        <footer className="bg-background border-t border-lavender-tint/50 py-12 text-sm text-muted-text">
          <div className="max-w-[1248px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Link href="/" className="flex items-center gap-2 text-primary font-bold text-[20px] leading-none hover:opacity-90 transition-opacity">
                <ProovLogo className="w-[18px] h-[18px] text-accent" />
                <span>Proov</span>
              </Link>
              <p className="text-xs text-muted-text text-center md:text-left">
                &copy; 2026 Proov. All rights reserved. Code Comprehension for Modern Teams.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
