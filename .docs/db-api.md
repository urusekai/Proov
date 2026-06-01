# DB & API

## Tables

### profiles
- id uuid, auth.users.id
- nickname text
- avatar_url text
- created_at timestamp
- updated_at timestamp

### problem_sets
- id uuid
- user_id uuid, nullable for curated public problem sets
- source_type text, `CURATED` or `GENERATED`
- visibility text, `PUBLIC` or `PRIVATE`
- display_title text
- difficulty text, `BEGINNER` or `INTERMEDIATE` or `ADVANCED`
- top-level difficulty는 PR에서 생성된 3문항의 대표 난이도이며, 목록/풀이 기준은 `questions.difficulty`
- estimated_minutes int
- language_tags text[]
- framework_tags text[]
- library_tags text[]
- topic_tags text[]
- pr_url text
- pr_title text
- repository_owner text
- repository_name text
- pull_number int
- base_branch text
- head_branch text
- ai_model text
- raw_ai_response jsonb, 생성 결과와 diff 표시용 `github.files` 보관
- created_at timestamp

### questions
- id uuid
- problem_set_id uuid
- type text
- tag text, question type tag
- difficulty text, `BEGINNER` or `INTERMEDIATE` or `ADVANCED`
- title text, 목록/기록용 짧은 문항 제목
- question text
- options jsonb
- answer text
- explanation text
- related_files text[]
- order_index int
- created_at timestamp

### submissions
- id uuid
- user_id uuid
- problem_set_id uuid
- score int
- correct_count int
- total_count int
- submitted_at timestamp

### submission_answers
- id uuid
- submission_id uuid
- question_id uuid
- selected_answer text
- correct_answer text
- is_correct boolean

## API

### POST /api/pr/validate
PR URL 검증.
```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```

### POST /api/pr/preview
로딩 화면용 PR 메타데이터 조회. GitHub PR API 1회만 호출하며 diff/files는 가져오지 않는다. 로그인 사용자만 호출할 수 있다.
```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```
Response:
```json
{
  "repository": "owner/repo",
  "pullNumber": 123,
  "title": "PR 제목",
  "prUrl": "https://github.com/owner/repo/pull/123"
}
```

### POST /api/problem-sets/generate
PR 분석 후 문제 생성. 로그인 사용자만 호출할 수 있다.
```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```
Response:
```json
{ "problemSetId": "uuid" }
```
변경 내용이 너무 적어 문제를 만들기 어렵다면 422로 응답.
```json
{ "error": "INSUFFICIENT_DIFF", "message": "이 PR은 변경 내용이 너무 적어 문제를 만들기 어렵습니다." }
```

### GET /api/problem-sets
사이트에서 제공하는 공개 문제 목록. `visibility = PUBLIC`인 ProblemSet에 속한 Question을 문항 단위로 반환한다. Supabase가 없거나 DB에 공개 문제가 없으면 코드 내 큐레이션 데이터(`src/data/curated-problem-sets.ts`)를 폴백으로 반환한다. 응답에 각 문항별 `submissionCount`(풀이 횟수)를 포함한다.
```json
{
  "items": [
    {
      "id": "question-uuid",
      "problemSetId": "problem-set-uuid",
      "displayTitle": "HTTP 클라이언트 실패 응답 흐름 읽기",
      "summary": "응답 처리와 비동기 제어 흐름을 읽고 코드 변경의 영향을 파악하는 문제입니다.",
      "title": "parseJson 콜백 시그니처 변경",
      "question": "변경된 parseJson 콜백은 어떤 인자를 추가로 받습니까?",
      "tag": "API_CONTRACT",
      "difficulty": "INTERMEDIATE",
      "languageTags": ["TypeScript"],
      "frameworkTags": [],
      "libraryTags": ["Ky"],
      "topicTags": ["HTTP Client", "Response Parsing"],
      "repository": "owner/repo",
      "prTitle": "Improve response parsing context",
      "prUrl": "https://github.com/owner/repo/pull/123",
      "pullNumber": 123,
      "relatedFiles": ["src/index.ts"],
      "createdAt": "2026-05-28T00:00:00.000Z"
    }
  ]
}
```

목록 API는 `created_at` 내림차순으로 조회한다. 클라이언트 최신순 정렬은 `createdAt` 기준이다.

### GET /api/problem-sets/:id
PR 묶음과 그 안의 문항을 조회한다. 풀이 전 화면에서는 정답과 해설을 응답하지 않는다. 클라이언트는 `?question=...`으로 특정 문항을 선택해 단일 문항 풀이 화면을 구성한다. PR 메타데이터와 diff 표시용 정보는 응답할 수 있다. 큐레이션 문제 세트는 slug ID로 직접 조회된다. `PRIVATE` 문제 세트는 소유자(로그인 사용자 본인)만 조회할 수 있으며, 그 외에는 404를 반환한다.

### DELETE /api/problem-sets/:id
내가 생성한 문제 세트를 삭제한다. 로그인 필수. `GENERATED` 문제 세트만 삭제할 수 있으며, 소유자(user_id)가 본인인 경우에만 허용된다.
- 소유자가 아닌 경우 403 반환
- `CURATED` 문제 세트는 403 반환
- 성공 시 204 반환

### GET /api/my-problem-sets
내가 PR URL로 생성한 문제 세트 목록. 로그인 필수. `source_type = GENERATED`이고 `user_id`가 현재 사용자인 세트와 그 안의 문항을 반환한다.
```json
{
  "items": [
    {
      "id": "problem-set-uuid",
      "sourceType": "GENERATED",
      "visibility": "PRIVATE",
      "displayTitle": "요청 초기화 훅의 옵션 복제 흐름",
      "difficulty": "INTERMEDIATE",
      "languageTags": ["TypeScript"],
      "frameworkTags": [],
      "libraryTags": [],
      "topicTags": [],
      "repository": "owner/repo",
      "pullNumber": 123,
      "prUrl": "https://github.com/owner/repo/pull/123",
      "prTitle": "PR 제목",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "questions": [
        {
          "id": "question-uuid",
          "tag": "DATA_FLOW",
          "difficulty": "INTERMEDIATE",
          "title": "init hook searchParams 복제 방식",
          "question": "...",
          "relatedFiles": ["src/core/Ky.ts"],
          "orderIndex": 0
        }
      ]
    }
  ]
}
```

### PATCH /api/profile
내 프로필 정보를 수정한다. 로그인 필수.
```json
{ "nickname": "proov", "avatarUrl": "https://example.com/avatar.png" }
```

### POST /api/account/change-password
현재 비밀번호 확인 후 새 비밀번호로 변경한다. 로그인 필수.
```json
{ "currentPassword": "old-password", "newPassword": "new-password" }
```

### DELETE /api/account
회원탈퇴를 처리한다. 로그인 필수. 탈퇴 전 확인용 이메일 같은 재확인 값을 요구할 수 있다.
```json
{ "confirmEmail": "user@example.com" }
```

### POST /api/problem-sets/:id/submit
답안 제출/채점. 기본 흐름은 단일 문항 제출이며, 로그인 사용자는 submission을 저장하고 비로그인 사용자는 저장하지 않은 결과 preview만 반환한다.
단일 문항 제출 시, 동일 사용자·동일 `question_id`에 대한 기존 submission이 있으면 insert 대신 해당 row를 갱신한다.
```json
{
  "answers": [
    { "questionId": "uuid", "selectedAnswer": "A" }
  ]
}
```

Response:
```json
{
  "result": {
    "id": "uuid-or-null",
    "saved": true,
    "score": 100,
    "correctCount": 1,
    "totalCount": 1,
    "submittedAt": "2026-05-28T00:00:00.000Z",
    "problemSet": {},
    "answers": []
  }
}
```

### GET /api/submissions
내 풀이 기록 목록. 문항(`question_id`)별 최신 submission 1건만 반환한다.

### GET /api/submissions/:id
내 풀이 기록 상세.

## Security
- 비로그인 사용자는 공개 문제 풀이와 결과 확인까지 가능
- PR URL 기반 문제 생성은 로그인 사용자만 가능
- 비로그인 사용자는 공개 문제 목록 조회와 풀이 가능
- 프로필 수정, 비밀번호 변경, 회원탈퇴는 로그인 사용자만 가능
- 풀이 기록 저장과 기록 조회는 로그인 사용자만 가능
- `PUBLIC` 문제 세트는 누구나 조회할 수 있고, `PRIVATE` 문제 세트는 생성자(user_id 일치) 또는 허용된 서버 흐름에서만 조회할 수 있음
- 내가 만든 문제 세트 삭제는 `user_id`가 현재 사용자이고 `source_type = GENERATED`인 경우에만 허용
- `CURATED` 문제 세트는 소유자 없음(user_id null), 삭제 불가
- submissions, submission_answers는 user_id로 소유권 확인
- Supabase RLS 적용
- service role key, OpenAI key, GitHub token은 서버 전용
- Supabase 적용 SQL은 `supabase/schema.sql`에 둔다. 초기화는 `supabase/reset.sql`로 public 테이블을 삭제한 뒤 `schema.sql`을 다시 실행한다.
- 로컬/개발 시드 계정: `testuser@naver.com` / 비밀번호 `testuser`, 프로필 닉네임 `testuser` (`schema.sql`의 `@@DEV_SEED` 구간).
- 큐레이션 `created_at`은 저장소명에 `tone` 또는 `goreon`이 포함된 세트가 최신순 앞에 오도록 시드한다.

## Tag Modeling
- MVP 초기 구현은 `problem_sets`의 세트 태그 배열과 `questions.tag` 문항 태그를 사용한다.
- 세트 태그: `language_tags`, `framework_tags`, `library_tags`, `topic_tags`
- 문항 태그: `questions.tag`
- 문항 제목: `questions.title`
- 문제 목록의 MVP Lite 필터는 문항 난이도/언어/프레임워크를 기준으로 Question 단위로 반환한다.
- 라이브러리/주제/문항 태그는 카드와 상세 화면에 노출하되, 현재 목록 필터에는 포함하지 않는다.
- 태그 관리, 동의어, 검색, 추천이 복잡해지면 `tags`, `problem_set_tags`, `question_tags` 테이블로 정규화한다.
