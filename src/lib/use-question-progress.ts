"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/supabase";
import type { SubmissionListItemData } from "@/lib/types";

export type QuestionProgressStatus = "untried" | "attempted" | "solved";

let cachedProgress: Map<string, QuestionProgressStatus> | null = null;
let cachedUserId: string | null = null;
let loadPromise: Promise<Map<string, QuestionProgressStatus>> | null = null;

export function invalidateQuestionProgressCache() {
  cachedProgress = null;
  cachedUserId = null;
  loadPromise = null;
}

function buildProgressMap(items: SubmissionListItemData[]): Map<string, QuestionProgressStatus> {
  const map = new Map<string, QuestionProgressStatus>();
  for (const item of items) {
    const answer = item.answers[0];
    if (!answer) continue;
    map.set(answer.questionId, answer.isCorrect ? "solved" : "attempted");
  }
  return map;
}

async function fetchQuestionProgress(userId: string | null): Promise<Map<string, QuestionProgressStatus>> {
  if (!userId) {
    cachedProgress = new Map();
    cachedUserId = null;
    return cachedProgress;
  }

  if (cachedProgress && cachedUserId === userId) {
    return cachedProgress;
  }

  const res = await apiFetch("/api/submissions");
  if (!res.ok) {
    cachedProgress = new Map();
    cachedUserId = userId;
    return cachedProgress;
  }

  const data = (await res.json()) as { items: SubmissionListItemData[] };
  cachedProgress = buildProgressMap(data.items);
  cachedUserId = userId;
  return cachedProgress;
}

type UseQuestionProgressOptions = {
  refreshOnMount?: boolean;
};

export function useQuestionProgress(options?: UseQuestionProgressOptions) {
  const { status, session } = useAuth();
  const userId = session?.user.id ?? null;
  const [progressByQuestionId, setProgressByQuestionId] = useState<
    Map<string, QuestionProgressStatus>
  >(() => cachedProgress ?? new Map());

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    if (options?.refreshOnMount) {
      invalidateQuestionProgressCache();
    }

    const load = () => {
      if (!loadPromise) {
        loadPromise = fetchQuestionProgress(userId).finally(() => {
          loadPromise = null;
        });
      }

      loadPromise.then((map) => {
        if (!cancelled) setProgressByQuestionId(new Map(map));
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [status, userId, options?.refreshOnMount]);

  return progressByQuestionId;
}
