import { z } from "zod";
import type { GitHubDiffFile } from "@/lib/types";

export const GITHUB_LIMITS = {
  maxFiles: 8,
  maxTotalDiffChars: 12_000,
  maxPatchCharsPerFile: 3_000,
  maxPrBodyChars: 1_000,
  minDiffChars: 200,
};

const prUrlSchema = z
  .string()
  .url()
  .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/?$/);

export type ParsedPrUrl = {
  owner: string;
  repo: string;
  pullNumber: number;
  prUrl: string;
};

export type CollectedPullRequest = ParsedPrUrl & {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  files: GitHubDiffFile[];
  diffText: string;
};

const EXCLUDED_PATH_PATTERNS = [
  /(^|\/)(package-lock|pnpm-lock|yarn\.lock|bun\.lockb)$/i,
  /(^|\/)(dist|build|coverage|\.next|node_modules)\//i,
  /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tar|mp4|mov|woff2?|ttf|eot)$/i,
  /\.min\.(js|css)$/i,
];

export function parseGitHubPrUrl(input: string): ParsedPrUrl | null {
  const parsed = prUrlSchema.safeParse(input.trim());
  if (!parsed.success) return null;

  const url = new URL(parsed.data);
  const [, owner, repo, , pull] = url.pathname.split("/");

  return {
    owner,
    repo,
    pullNumber: Number(pull),
    prUrl: `https://github.com/${owner}/${repo}/pull/${pull}`,
  };
}

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
    patch: file.patch.slice(0, GITHUB_LIMITS.maxPatchCharsPerFile),
  };
}

export async function collectPullRequest(prUrl: string): Promise<CollectedPullRequest> {
  const parsed = parseGitHubPrUrl(prUrl);
  if (!parsed) {
    throw Object.assign(new Error("Invalid GitHub PR URL."), { code: "INVALID_PR_URL" });
  }

  const prResponse = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.pullNumber}`,
    { headers: githubHeaders() }
  );
  if (!prResponse.ok) {
    throw Object.assign(new Error("GitHub PR fetch failed."), { code: "PR_NOT_FOUND" });
  }
  const pr = (await prResponse.json()) as {
    title: string;
    body: string | null;
    base: { ref: string };
    head: { ref: string };
  };

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
    .slice(0, GITHUB_LIMITS.maxFiles);

  const diffText = files
    .map((file) => `File: ${file.filename}\n${file.patch ?? ""}`)
    .join("\n\n")
    .slice(0, GITHUB_LIMITS.maxTotalDiffChars);

  if (files.length === 0 || diffText.replace(/\s/g, "").length < GITHUB_LIMITS.minDiffChars) {
    throw Object.assign(new Error("Insufficient diff."), { code: "INSUFFICIENT_DIFF" });
  }

  return {
    ...parsed,
    title: pr.title,
    body: (pr.body ?? "").slice(0, GITHUB_LIMITS.maxPrBodyChars),
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    files,
    diffText,
  };
}
