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
- summary text
- difficulty text, `BEGINNER` or `INTERMEDIATE` or `ADVANCED`
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
- raw_ai_response jsonb
- created_at timestamp

### questions
- id uuid
- problem_set_id uuid
- type text
- tag text, question type tag
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

### POST /api/problem-sets/generate
PR 분석 후 문제 생성. 로그인 사용자만 호출할 수 있다.
```json
{ "prUrl": "https://github.com/owner/repo/pull/123" }
```
Response:
```json
{ "problemSetId": "uuid" }
```
변경 내용이 너무 적어 3문항 생성이 어렵다면 422로 응답.
```json
{ "error": "INSUFFICIENT_DIFF", "message": "이 PR은 변경 내용이 너무 적어 3개의 문제를 만들기 어렵습니다." }
```

### GET /api/problem-sets
사이트에서 제공하는 공개 문제 세트 목록. `visibility = PUBLIC`인 세트만 반환한다.
```json
{
  "items": [
    {
      "id": "uuid",
      "displayTitle": "HTTP 클라이언트 실패 응답 흐름 읽기",
      "summary": "응답 처리와 비동기 제어 흐름을 읽고 코드 변경의 영향을 파악하는 문제입니다.",
      "difficulty": "INTERMEDIATE",
      "languageTags": ["TypeScript"],
      "frameworkTags": [],
      "libraryTags": ["Ky"],
      "topicTags": ["HTTP Client", "Response Parsing"],
      "questionTypeTags": ["Error Handling", "Data Flow", "Side Effect"],
      "repository": "owner/repo",
      "prTitle": "Improve response parsing context",
      "prUrl": "https://github.com/owner/repo/pull/123",
      "pullNumber": 123
    }
  ]
}
```

### GET /api/problem-sets/:id
문제 세트 조회. 풀이 전 화면에서는 정답과 해설을 응답하지 않는다. PR 메타데이터와 diff 표시용 정보는 응답할 수 있다.

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
답안 제출/채점. 로그인 사용자는 submission을 저장하고, 비로그인 사용자는 저장하지 않은 결과 preview만 반환한다.
```json
{
  "answers": [
    { "questionId": "uuid", "selectedAnswer": "A" }
  ]
}
```

### GET /api/submissions
내 풀이 기록 목록.

### GET /api/submissions/:id
내 풀이 기록 상세.

## Security
- 비로그인 사용자는 공개 문제 세트 풀이와 결과 확인까지 가능
- PR URL 기반 문제 생성은 로그인 사용자만 가능
- 비로그인 사용자는 공개 문제 세트 목록 조회와 풀이 가능
- 프로필 수정, 비밀번호 변경, 회원탈퇴는 로그인 사용자만 가능
- 풀이 기록 저장과 기록 조회는 로그인 사용자만 가능
- `PUBLIC` 문제 세트는 누구나 조회할 수 있고, `PRIVATE` 문제 세트는 생성자 또는 허용된 서버 흐름에서만 조회할 수 있음
- submissions, submission_answers는 user_id로 소유권 확인
- Supabase RLS 적용
- service role key, OpenAI key, GitHub token은 서버 전용

## Tag Modeling
- MVP 초기 구현은 `problem_sets`의 세트 태그 배열과 `questions.tag` 문항 태그를 사용한다.
- 세트 태그: `language_tags`, `framework_tags`, `library_tags`, `topic_tags`
- 문항 태그: `questions.tag`
- 문제 세트 목록의 MVP Lite 필터는 난이도/언어/프레임워크를 기준으로 ProblemSet 단위로 반환한다.
- 라이브러리/주제/문항 태그는 카드와 상세 화면에 노출하되, 현재 목록 필터에는 포함하지 않는다.
- 태그 관리, 동의어, 검색, 추천이 복잡해지면 `tags`, `problem_set_tags`, `question_tags` 테이블로 정규화한다.
