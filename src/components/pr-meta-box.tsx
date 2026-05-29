import { GitPullRequest } from "lucide-react";

type PrMetaBoxProps = {
  repository: string;
  pullNumber: number;
  prTitle?: string;
  className?: string;
};

export function PrMetaBox({ repository, pullNumber, prTitle, className = "" }: PrMetaBoxProps) {
  return (
    <div
      className={`rounded-xl border border-lavender-tint bg-background/60 p-4 ${className}`.trim()}
    >
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <GitPullRequest className="h-4 w-4 shrink-0 text-accent" />
        <p className="truncate font-mono text-[11px] font-bold text-accent">
          {repository} #{pullNumber}
        </p>
      </div>
      {prTitle ? (
        <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-text">{prTitle}</p>
      ) : (
        <div className="space-y-2" aria-hidden>
          <div className="h-3.5 w-full max-w-[92%] animate-pulse rounded bg-lavender-tint/70" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-lavender-tint/50" />
        </div>
      )}
    </div>
  );
}
