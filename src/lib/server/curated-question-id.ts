import { curatedProblemSets } from "@/data/curated-problem-sets";
import { curatedProblemSetDbId, curatedQuestionDbId } from "@/lib/server/stable-id";

/** API·DB의 question UUID를 화면용 큐레이션 slug id로 변환 */
export function publicQuestionIdFromDbId(dbQuestionId: string, problemSetDbId: string): string {
  for (const set of curatedProblemSets) {
    if (curatedProblemSetDbId(set.id) !== problemSetDbId) continue;
    for (const question of set.questions) {
      if (curatedQuestionDbId(question.id) === dbQuestionId) {
        return question.id;
      }
    }
  }
  return dbQuestionId;
}
