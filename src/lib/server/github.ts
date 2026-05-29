import { PR_DIFF_LIMITS } from "@/lib/pr-diff-policy";
import { parseGitHubPrUrl, type ParsedPrUrl } from "@/lib/github-pr-url";
import type { GitHubDiffFile } from "@/lib/types";

export const GITHUB_LIMITS = PR_DIFF_LIMITS;
export { parseGitHubPrUrl, type ParsedPrUrl };

export type CollectedPullRequest = ParsedPrUrl & {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  files: GitHubDiffFile[];
  diffText: string;
};

export type PullRequestPreview = ParsedPrUrl & {
  repository: string;
  title: string;
};

type GitHubPullPayload = {
  title: string;
  body: string | null;
  base: { ref: string };
  head: { ref: string };
};

const EXCLUDED_PATH_PATTERNS = [
  /(^|\/)(package-lock|pnpm-lock|yarn\.lock|bun\.lockb)$/i,
  /(^|\/)(dist|build|coverage|\.next|node_modules)\//i,
  /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tar|mp4|mov|woff2?|ttf|eot)$/i,
  /\.min\.(js|css)$/i,
];

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

function isExcludedFile(filename: string): boolean {
  return EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(filename));
}

function normalizePatch(file: GitHubDiffFile): GitHubDiffFile | null {
  if (!file.patch || isExcludedFile(file.filename)) return null;
  return {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch.slice(0, PR_DIFF_LIMITS.maxPatchCharsPerFile),
  };
}

async function fetchGitHubPull(
  parsed: ParsedPrUrl
): Promise<GitHubPullPayload> {
  const prResponse = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.pullNumber}`,
    { headers: githubHeaders() }
  );
  if (!prResponse.ok) {
    if (prResponse.status === 403 || prResponse.status === 429) {
      throw Object.assign(new Error("GitHub API rate limit exceeded."), { code: "GITHUB_RATE_LIMITED" });
    }
    throw Object.assign(new Error("GitHub PR fetch failed."), { code: "PR_NOT_FOUND" });
  }
  return (await prResponse.json()) as GitHubPullPayload;
}

export async function fetchPullRequestPreview(prUrl: string): Promise<PullRequestPreview> {
  const parsed = parseGitHubPrUrl(prUrl);
  if (!parsed) {
    throw Object.assign(new Error("Invalid GitHub PR URL."), { code: "INVALID_PR_URL" });
  }

  const pr = await fetchGitHubPull(parsed);
  return {
    ...parsed,
    repository: `${parsed.owner}/${parsed.repo}`,
    title: pr.title,
  };
}

export async function collectPullRequest(prUrl: string): Promise<CollectedPullRequest> {
  const parsed = parseGitHubPrUrl(prUrl);
  if (!parsed) {
    throw Object.assign(new Error("Invalid GitHub PR URL."), { code: "INVALID_PR_URL" });
  }

  const pr = await fetchGitHubPull(parsed);

  const filesResponse = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.pullNumber}/files?per_page=100`,
    { headers: githubHeaders() }
  );
  if (!filesResponse.ok) {
    throw Object.assign(new Error("GitHub PR files fetch failed."), { code: "PR_FILES_FAILED" });
  }
  const rawFiles = (await filesResponse.json()) as GitHubDiffFile[];
  const files = rawFiles
    .map(normalizePatch)
    .filter((file): file is GitHubDiffFile => Boolean(file))
    .slice(0, PR_DIFF_LIMITS.maxFiles);

  const diffText = files
    .map((file) => `File: ${file.filename}\n${file.patch ?? ""}`)
    .join("\n\n")
    .slice(0, PR_DIFF_LIMITS.maxTotalDiffChars);

  const totalChangedLines = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
  if (files.length === 0 || totalChangedLines < PR_DIFF_LIMITS.minChangedLines) {
    throw Object.assign(new Error("Insufficient diff."), { code: "INSUFFICIENT_DIFF" });
  }

  return {
    ...parsed,
    title: pr.title,
    body: (pr.body ?? "").slice(0, PR_DIFF_LIMITS.maxPrBodyChars),
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    files,
    diffText,
  };
}
