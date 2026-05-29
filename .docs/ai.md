# AI Policy

## Model
- GPT-5.4 단일 모델 사용

## 입력
- PR 제목
- PR 설명 (있을 때만 포함)
- repository
- 변경 파일 목록
- 필터링된 diff
- 출력 JSON schema

## 생성 규칙
- 객관식 1~3문항 생성 (diff가 지지하는 만큼만 생성, 억지로 채우지 않음)
- diff가 풍부하면 3문항, 2개의 학습 포인트만 있으면 2문항, 최소 1문항
- 각 문제는 A/B/C/D 4지선다
- 정답은 반드시 1개
- 모든 문제는 diff에 근거
- diff에 없는 내용 추측 금지
- 변경 내용 부족 기준은 `spec.md`의 제한 정책을 따른다 (실제 변경 줄 수 5줄 미만 시 API 호출 전 차단)
- 태그를 미리 강제 배정하지 않음
- 문제를 먼저 생성한 뒤 각 문제에 가장 적절한 태그를 사후 부여
- 각 문제에 가장 적절한 난이도를 사후 부여 (PR 규모가 아닌 문항 내용 기준)
- 각 문제에 목록/기록용 title을 함께 생성
- 같은 태그가 여러 번 나와도 허용
- 태그 다양성보다 문제 품질과 diff 근거성을 우선
- 단순 파일명 암기 문제 금지
- 해설은 한국어 2문장 이내
- relatedFiles는 diff에 있는 파일 1~3개
- PR 출처/맥락 표시를 위한 displayTitle을 함께 생성
- top-level difficulty는 AI 판단 대신 코드에서 문항 난이도 중앙값으로 재계산 (동률은 높은 쪽)
- 문제 세트 분류를 위한 languageTags, frameworkTags, libraryTags, topicTags를 함께 생성
- 세트 태그는 PR 전체 맥락 기준으로 부여하고, 문항 태그는 각 문제의 코드 이해 유형 기준으로 부여
- displayTitle은 PR 제목을 그대로 복사하지 않고, 사용자가 학습 주제를 바로 이해할 수 있는 한국어 제목으로 작성
- displayTitle은 정답 조건이나 변경 결론을 직접 드러내지 않고, 읽게 될 코드 영역과 학습 주제만 넓게 설명
- 각 문항 difficulty는 BEGINNER, INTERMEDIATE, ADVANCED 중 하나 (문항 내용 기준, 사용자 화면에는 쉬움/보통/어려움으로 표시)
- 각 문항 title은 한국어 명사구 또는 명사절(~되는/~하는/~할 때의 형태 허용)이며 완전한 질문형 문장으로 쓰지 않음
- title은 정답 조건이나 변경 결론을 직접 드러내지 않음
- title은 목록 카드 제목으로서 코드를 보기 전에 "어떤 개념을 배우는 문제인지" 전달해야 함
- 잘 알려진 API/프레임워크 메서드(useEffect, fetch, parseJson 등)는 이름을 그대로 써도 됨
- 도메인 내부 함수명(replayCurrentTrack, hasServerSession 등)은 이름 대신 개념/동작으로 표현
- 예: '에러 처리 로직'(너무 범주적) → '한 곡 반복 재생 시 재생 위치가 초기화되는 방식'(개념 기술) 또는 'catch 스키마가 optional로 처리되는 조건'(잘 알려진 개념)
- BEGINNER: 변경된 라인을 직접 읽으면 답을 알 수 있음. 명시적으로 드러난 값·조건·이름 확인
- INTERMEDIATE: 변경의 의도나 효과를 이해해야 함. 변경 전후 비교, 1~2단계 흐름 추적, 코드 동작 해석 필요
- ADVANCED: 명시되지 않은 결과를 추론해야 함. 엣지 케이스, 실패 모드, 암묵적 side effect, diff에 없는 호출부에 미칠 영향 파악 필요
## Question Tag

| 내부 값 | 사용자 표시 | 설명 |
| --- | --- | --- |
| CODE_BEHAVIOR | 코드 동작 | 변경된 코드의 실행 결과와 동작 방식 (조건·분기 로직 포함) |
| DATA_FLOW | 데이터 흐름 | 값, 요청/응답이 코드를 거치는 경로 |
| STATE_CHANGE | 상태 변화 | state, 캐시, 스토어, 저장값의 변화 (부수 효과 포함) |
| ERROR_HANDLING | 에러 처리 | 예외, 실패, fallback, retry 처리 |
| API_CONTRACT | API 명세 | 함수/API의 입력, 출력, 응답 형식 변화 |
| TEST_INTENT | 테스트 의도 | 테스트가 검증하는 동작과 목적 |
| STRUCTURAL_CHANGE | 구조 변경 | 코드 구조 정리, 책임 이동, 모듈 분리 |
| CONFIG_CHANGE | 설정값 | 환경, 빌드, 상수, 옵션 설정 변화 |

## Prompt 핵심
```txt
Create 1 to 3 Korean multiple-choice questions from the GitHub PR diff.
Generate as many questions as the diff genuinely supports — do not pad with weak questions to reach 3.
Prefer 3 questions if the diff is rich enough. Use 2 if only 2 distinct learning points exist. Use 1 only if the diff is minimal but still yields one solid question.
Use only facts from the diff. Do not infer beyond the patch.
Generate the best questions first, then assign the single best matching tag to each question.
Assign difficulty per question based on the cognitive effort required to answer that specific question:
BEGINNER: the answer is explicitly present in the changed lines — reading the diff is sufficient.
INTERMEDIATE: requires understanding the meaning or effect of the change — interpreting intent, comparing before/after, or following 1-2 steps of data/control flow.
ADVANCED: requires reasoning about non-obvious consequences — edge cases, failure modes, implicit side effects, or impact on code not shown in the diff.
For each question, create title. title must be Korean, short, noun-phrase style, not a question, and must not reveal the answer.
Also create displayTitle, summary, languageTags, frameworkTags, libraryTags, and topicTags.
Set top-level difficulty to any valid value — it will be recalculated from question difficulties.
displayTitle must describe the learning topic, not just copy the PR title.
displayTitle and summary must not reveal the exact answer condition.
Do not force tag diversity. Multiple questions may use the same tag.
Prioritize question quality and diff-grounded reasoning over tag balance.
Each question has 4 options A-D and exactly one answer.
Do not ask file-name-only questions.
Even if the diff is small, look for questions from explicit behavior, data flow, API shape, error handling, tests, config, constants, return values, or structure changes.
Explanation must be Korean and max 2 sentences.
relatedFiles must include 1-3 paths from the diff.
Return valid JSON only.
```

## Type
```ts
export type QuestionTag =
  | "CODE_BEHAVIOR"
  | "DATA_FLOW"
  | "STATE_CHANGE"
  | "ERROR_HANDLING"
  | "API_CONTRACT"
  | "TEST_INTENT"
  | "STRUCTURAL_CHANGE"
  | "CONFIG_CHANGE";

export type GeneratedProblemSet = {
  displayTitle: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  languageTags: string[];
  frameworkTags: string[];
  libraryTags: string[];
  topicTags: string[];
  questions: {
    type: "MULTIPLE_CHOICE";
    tag: QuestionTag;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    title: string;
    question: string;
    options: { id: "A" | "B" | "C" | "D"; text: string }[];
    answer: "A" | "B" | "C" | "D";
    explanation: string;
    relatedFiles: string[];
  }[];
};
```

## Zod 검증
- questions 1~3개 (min 1, max 3)
- displayTitle 비어 있으면 안 됨
- difficulty는 BEGINNER/INTERMEDIATE/ADVANCED 중 하나
- title 비어 있으면 안 됨
- languageTags/frameworkTags/libraryTags/topicTags는 문자열 배열
- languageTags는 최소 1개
- 존재하지 않는 프레임워크/라이브러리는 추측해서 넣지 않음
- options 길이 4
- answer는 A/B/C/D
- tag는 enum 중 하나
- difficulty는 BEGINNER/INTERMEDIATE/ADVANCED 중 하나
- tag 중복 허용
- relatedFiles 1~3개
- explanation 비어 있으면 안 됨
