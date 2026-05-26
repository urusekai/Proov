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
- user_id uuid, nullable for guest practice
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
- tag text
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
PR 분석 후 문제 생성. 비로그인 사용자도 호출할 수 있다.
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

### GET /api/problem-sets/:id
문제 세트 조회. 풀이 전 화면에서는 정답과 해설을 응답하지 않는다.

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
- 비로그인 사용자는 문제 생성, 문제 풀이, 결과 확인까지 가능
- 풀이 기록 저장과 기록 조회는 로그인 사용자만 가능
- submissions, submission_answers는 user_id로 소유권 확인
- Supabase RLS 적용
- service role key, OpenAI key, GitHub token은 서버 전용
