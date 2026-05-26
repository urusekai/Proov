# AI Policy

## Model
- GPT-5.4 단일 모델 사용

## 입력
- PR 제목
- PR 설명
- repository
- base/head branch
- 변경 파일 목록
- 필터링된 diff
- 출력 JSON schema

## 생성 규칙
- 객관식 3문항만 생성
- 각 문제는 A/B/C/D 4지선다
- 정답은 반드시 1개
- 모든 문제는 diff에 근거
- diff에 없는 내용 추측 금지
- 변경 내용이 너무 적어 3문항을 만들 수 없으면 OpenAI API 호출 전에 차단
- 변경 내용 부족 기준은 `spec.md`의 제한 정책을 따른다
- 태그를 미리 강제 배정하지 않음
- 문제 3개를 먼저 생성한 뒤 각 문제에 가장 적절한 태그를 사후 부여
- 같은 태그가 여러 번 나와도 허용
- 태그 다양성보다 문제 품질과 diff 근거성을 우선
- 단순 파일명 암기 문제 금지
- 해설은 한국어 2문장 이내
- relatedFiles는 diff에 있는 파일 1~3개

## Question Tag

| 내부 값 | 사용자 표시 | 설명 |
| --- | --- | --- |
| CODE_BEHAVIOR | Code Behavior | 변경된 코드의 실행 동작 |
| DATA_FLOW | Data Flow | 값, 상태, 요청/응답 흐름 |
| STATE_CHANGE | State Change | state, cache, DB 저장값 변화 |
| SIDE_EFFECT | Side Effect | 엣지 케이스와 주변 흐름 영향 |
| ERROR_HANDLING | Error Handling | 예외, 실패, fallback, retry 처리 |
| API_CONTRACT | API Contract | 함수/API 입력, 출력, 응답 형식 변화 |
| TEST_INTENT | Test Intent | 테스트가 검증하는 동작 |
| LOGIC_ERROR | Logic Error | 논리 오류 수정 또는 잠재적 논리 문제 이해 |
| STRUCTURAL_CHANGE | Structural Change | 구조 정리, 책임 이동, 분리, 이름 변경 |
| CONFIG_CHANGE | Config Change | 환경, 빌드, 옵션 설정 변화 |

## Prompt 핵심
```txt
Create exactly 3 Korean multiple-choice questions from the GitHub PR diff.
Use only facts from the diff.
Generate the 3 best questions first, then assign the single best matching tag to each question.
Do not force tag diversity. Multiple questions may use the same tag.
Prioritize question quality and diff-grounded reasoning over tag balance.
Each question has 4 options A-D and exactly one answer.
Do not ask file-name-only questions.
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
  | "SIDE_EFFECT"
  | "ERROR_HANDLING"
  | "API_CONTRACT"
  | "TEST_INTENT"
  | "LOGIC_ERROR"
  | "STRUCTURAL_CHANGE"
  | "CONFIG_CHANGE";

export type GeneratedProblemSet = {
  questions: {
    type: "MULTIPLE_CHOICE";
    tag: QuestionTag;
    question: string;
    options: { id: "A" | "B" | "C" | "D"; text: string }[];
    answer: "A" | "B" | "C" | "D";
    explanation: string;
    relatedFiles: string[];
  }[];
};
```

## Zod 검증
- questions 길이 3
- options 길이 4
- answer는 A/B/C/D
- tag는 enum 중 하나
- tag 중복 허용
- relatedFiles 1~3개
- explanation 비어 있으면 안 됨
