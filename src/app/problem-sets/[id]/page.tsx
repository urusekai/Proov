"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FileCode,
  GitPullRequest,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/supabase";
import type { ProblemSetDetail, QuestionTag } from "@/lib/types";

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

type GitHubFile = {
  filename: string;
  patch?: string;
  status: string;
  additions: number;
  deletions: number;
};

type DiffState =
  | { status: "loading"; files: GitHubFile[] }
  | { status: "ready"; files: GitHubFile[] }
  | { status: "error"; files: GitHubFile[] };

const META_PREFIXES = [
  "diff --git",
  "new file mode",
  "deleted file mode",
  "old mode",
  "new mode",
  "index ",
  "--- ",
  "+++ ",
  "Binary files",
  "similarity index",
  "rename from",
  "rename to",
];

function DiffViewer({ patch }: { patch: string }) {
  const lines = patch.split("\n").filter((line) => {
    const t = line.trim();
    return !META_PREFIXES.some((p) => t.startsWith(p));
  });

  return (
    <div className="scrollbar-thin font-mono text-xs overflow-auto bg-white text-slate-700 leading-relaxed h-full">
      {lines.map((line, idx) => {
        let cls = "bg-white text-slate-700";
        if (line.startsWith("+")) cls = "bg-[#ecfdf5] text-[#10b981]";
        else if (line.startsWith("-")) cls = "bg-[#fef2f2] text-[#ef4444]";
        else if (line.startsWith("@@"))
          cls = "bg-lavender-tint/30 text-primary font-semibold";

        return (
          <div
            key={idx}
            className={`py-0.5 px-3 whitespace-pre flex min-w-max ${cls}`}
          >
            <span className="inline-block w-8 text-slate-400 select-none mr-3 text-right text-[11px] shrink-0">
              {idx + 1}
            </span>
            <span className="pr-4">{line}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProblemSetSolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [problemSet, setProblemSet] = useState<ProblemSetDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [activeFile, setActiveFile] = useState<string>("");
  const [diffState, setDiffState] = useState<DiffState>({
    status: "loading",
    files: [],
  });

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/problem-sets/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: { item: ProblemSetDetail }) => {
        if (cancelled) return;
        setProblemSet(data.item);
        setActiveFile(data.item.sourceFiles[0] ?? "");
        if (data.item.diffFiles && data.item.diffFiles.length > 0) {
          setDiffState({ status: "ready", files: data.item.diffFiles });
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!problemSet || (problemSet.diffFiles && problemSet.diffFiles.length > 0)) return;
    let cancelled = false;

    const { repositoryOwner, repositoryName, pullNumber } = problemSet;
    fetch(
      `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls/${pullNumber}/files`,
      { headers: { Accept: "application/vnd.github+json" } }
    )
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: GitHubFile[]) => {
        const relevant = data.filter((f) =>
          problemSet.sourceFiles.some(
            (sf) => f.filename === sf || f.filename.endsWith(`/${sf}`) || sf.endsWith(f.filename)
          )
        );
        if (!cancelled) {
          setDiffState({
            status: "ready",
            files: relevant.length > 0 ? relevant : data.slice(0, 8),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDiffState({ status: "error", files: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [problemSet]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <SiteHeader activePath="/problem-sets" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-24">
            <p className="text-lg font-bold text-text mb-2">
              문제 세트를 찾을 수 없습니다.
            </p>
            <Link
              href="/problem-sets"
              className="text-sm text-accent hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!problemSet) return null;

  const question = problemSet.questions[currentQ];
  const totalQ = problemSet.questions.length;
  const currentFileList =
    diffState.files.length > 0
      ? diffState.files.map((f) => f.filename)
      : problemSet.sourceFiles;
  const relatedDiffFiles = question.relatedFiles.length > 0 ? question.relatedFiles : currentFileList;
  const selectedFile = relatedDiffFiles.includes(activeFile)
    ? activeFile
    : relatedDiffFiles[0] ?? currentFileList[0] ?? "";
  const activePatch =
    diffState.files.find(
      (f) =>
        f.filename === selectedFile ||
        f.filename.endsWith(`/${selectedFile}`) ||
        selectedFile.endsWith(f.filename)
    )?.patch ?? null;

  const handleSelect = (opt: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({ ...prev, [currentQ]: opt }));
  };

  const moveToQuestion = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(totalQ - 1, nextIndex));
    setCurrentQ(safeIndex);
    setActiveFile(problemSet.questions[safeIndex].relatedFiles[0] ?? problemSet.sourceFiles[0] ?? "");
  };

  const handleSubmit = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `answers-${id}`,
        JSON.stringify(answers)
      );
    }
    apiFetch(`/api/problem-sets/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: problemSet.questions.map((question, index) => ({
          questionId: question.id,
          selectedAnswer: answers[index],
        })),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("submit failed");
        return res.json();
      })
      .then((data) => {
        sessionStorage.setItem(`result-${id}`, JSON.stringify(data.result));
        router.push(`/problem-sets/${id}/result`);
      })
      .catch(() => {
        router.push(`/problem-sets/${id}/result`);
      });
  };

  const allAnswered = Object.keys(answers).length === totalQ;
  const finalPrUrl = problemSet.prUrl;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background font-sans selection:bg-accent/20">
      <SiteHeader activePath="/problem-sets" />

      <main className="flex-1 min-h-0 overflow-auto xl:overflow-hidden">
        <div className="w-full max-w-none mx-auto px-4 py-4 md:px-6 xl:px-8 2xl:px-10 flex flex-col gap-4 xl:h-full xl:min-h-0 xl:overflow-hidden">
          {/* Top Header Row: Repository name, PR Title, and Actual PR button */}
          <div className="bg-white rounded-xl border border-lavender-tint shadow-default p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-accent">
                    {problemSet.repository}
                  </span>
                  <span className="font-mono bg-lavender-tint text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    #{problemSet.pullNumber}
                  </span>
                </div>
                <h1
                  className="text-sm md:text-base font-bold text-text truncate max-w-[320px] md:max-w-[480px]"
                  title={problemSet.prTitle}
                >
                  {problemSet.prTitle}
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
                href="/problem-sets"
                className="inline-flex items-center justify-center text-xs md:text-sm font-bold border border-lavender-tint text-muted-text hover:text-text hover:bg-lavender-tint/20 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                연습 중단
              </Link>
            </div>
          </div>

          {/* 2-Column Grid Layout */}
          <div className="grid xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_560px] gap-6 w-full items-start xl:items-stretch xl:flex-1 xl:min-h-0">
            {/* LEFT PANEL: Git Diff Code Viewer */}
            <section className="bg-white rounded-xl border border-lavender-tint shadow-default overflow-hidden flex flex-col min-w-0 xl:h-full xl:min-h-0">
              <div className="border-b border-lavender-tint px-4 py-3">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="변경 파일 diff">
                  {relatedDiffFiles.map((file) => {
                    const isSelected = file === selectedFile;

                    return (
                      <button
                        key={file}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveFile(file)}
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
                {diffState.status === "loading" && (
                  <div className="h-full min-h-[420px] flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-3 text-muted-text">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      <span className="text-sm">GitHub에서 diff를 불러오는 중...</span>
                    </div>
                  </div>
                )}

                {diffState.status === "error" && (
                  <div className="h-full min-h-[420px] flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-3 text-center px-8">
                      <AlertCircle className="w-8 h-8 text-muted-text/60" />
                      <p className="text-sm font-semibold text-text">
                        diff를 불러올 수 없습니다
                      </p>
                      <p className="text-xs text-muted-text">
                        GitHub API 요청이 실패했습니다. 네트워크 상태를 확인하거나
                        문제를 계속 풀어보세요.
                      </p>
                      <a
                        href={problemSet.sourcePatchUrl ?? `${problemSet.prUrl}.patch`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        GitHub에서 직접 보기 →
                      </a>
                    </div>
                  </div>
                )}

                {diffState.status === "ready" && (
                  activePatch ? (
                    <DiffViewer patch={activePatch} />
                  ) : (
                    <div className="h-full min-h-[420px] flex items-center justify-center bg-white">
                      <div className="flex flex-col items-center gap-2 text-center px-8">
                        <FileCode className="w-7 h-7 text-muted-text/50" />
                        <p className="text-sm text-muted-text">
                          이 파일의 diff를 표시할 수 없습니다.
                        </p>
                        <a
                          href={`${problemSet.prUrl}/files`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          GitHub에서 보기 →
                        </a>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* RIGHT PANEL: Question Solver */}
            <aside className="bg-white rounded-xl border border-lavender-tint shadow-default p-5 md:p-6 min-w-0 xl:h-full xl:min-h-0 xl:overflow-hidden flex flex-col">
              <div className="xl:flex-1 xl:min-h-0">
                <div className="grid grid-cols-3 gap-2 mb-7" aria-label="문제 진행률">
                  {problemSet.questions.map((_, idx) => {
                    const isSelected = idx === currentQ;
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

                <div className="mb-5 flex justify-start">
                  <span className="inline-flex items-center bg-accent/10 text-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {TAG_LABELS[question.tag]}
                  </span>
                </div>

                <h2 className="text-base md:text-lg font-bold text-text leading-relaxed mb-7">
                  <span>{question.question}</span>
                </h2>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = answers[currentQ] === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
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
                    onClick={() => moveToQuestion(currentQ - 1)}
                    disabled={currentQ === 0}
                    className="flex items-center justify-center gap-1 text-xs font-bold text-muted-text hover:text-text px-3 py-2.5 border border-lavender-tint rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>이전</span>
                  </button>

                  <button
                    onClick={() => moveToQuestion(currentQ + 1)}
                    disabled={currentQ === totalQ - 1}
                    className="flex items-center justify-center gap-1 text-xs font-bold text-muted-text hover:text-text px-3 py-2.5 border border-lavender-tint rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>다음</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="w-full bg-accent text-white py-2.5 rounded-lg text-xs md:text-sm font-extrabold hover:bg-primary transition-all active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                >
                  답안 제출
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
