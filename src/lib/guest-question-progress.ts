const STORAGE_KEY = "proov_guest_question_progress";

type StoredGuestProgress = "attempted" | "solved";

function readRaw(): Record<string, StoredGuestProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredGuestProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readGuestQuestionProgress(): Map<string, StoredGuestProgress> {
  const entries = Object.entries(readRaw()).filter(
    ([, status]) => status === "attempted" || status === "solved"
  );
  return new Map(entries);
}

export function recordGuestQuestionProgress(questionId: string, isCorrect: boolean) {
  if (typeof window === "undefined" || !questionId) return;

  const status: StoredGuestProgress = isCorrect ? "solved" : "attempted";
  const next = { ...readRaw(), [questionId]: status };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
