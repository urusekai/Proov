import { z } from "zod";

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

export function formatPrRepository(parsed: Pick<ParsedPrUrl, "owner" | "repo">) {
  return `${parsed.owner}/${parsed.repo}`;
}
