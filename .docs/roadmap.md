# Roadmap

개발 전 기준을 빠르게 확인하기 위한 실행 계획서다. 상세 정책은 `spec.md`, AI 생성 규칙은 `ai.md`, DB/API 계약은 `db-api.md`, UI 기준은 `design.md`와 프로토타입을 따른다.

## 핵심 원칙
- 비로그인 사용자는 PR 입력, 문제 생성, 풀이, 결과 확인까지 가능하다.
- 로그인은 결과 저장, 기록 목록/상세 조회가 필요할 때 요구한다.
- 로그인 후 `/`는 랜딩보다 대시보드에 가깝게 구성한다: 큰 PR 입력창, 최근 풀이 기록, 간단한 성과 요약.
- 결과 화면에서 비로그인 사용자에게 저장 CTA를 노출한다.
- GitHub OAuth, 비공개 repo, 5문항, 티어/랭킹/공개 프로필, 결제, 서술형, 코드 라인 근거는 MVP에서 제외한다.

## 구현 지침
- API key와 service role key는 서버에서만 사용한다.
- OpenAI 호출 전 PR URL 검증, 제외 파일 필터링, diff 제한, 변경 내용 부족 여부를 먼저 검사한다.
- 제한 수치와 기능 범위는 `spec.md`를 따른다.
- AI 생성 규칙과 Zod 검증은 `ai.md`를 따른다.
- 풀이 전 문제 조회 응답에는 정답과 해설을 포함하지 않는다.
- 사용자는 자기 기록만 조회할 수 있어야 한다.

## IA
```txt
/
  로그인 전: 소개 + PR 입력 + 비교 카드
  로그인 후: PR 입력 + 최근 기록 + 요약

/auth/login, /auth/signup
  이메일 인증

/practice/new
  PR URL 입력

/practice/loading
  PR 분석 및 문제 생성 진행 상태

/problem-sets/[id]
  객관식 3문항 풀이

/problem-sets/[id]/result
  채점 결과, 해설, 태그 분포, 로그인 저장 CTA

/history
  로그인 사용자 풀이 기록 목록

/history/[submissionId]
  로그인 사용자 풀이 기록 상세
```

## 화면 체크리스트
- Landing: 로그인 전은 설득과 체험 시작, 로그인 후는 바로 시작과 최근 기록 중심.
- Auth: 이메일, 비밀번호, 제출, 전환 링크, 오류 메시지.
- New Practice: PR URL 입력, URL 검증 상태, 문제 생성 버튼.
- Generating: 처리 단계, 진행 상태, PR 요약, 취소 버튼, 인라인 오류.
- Problem Solving: PR 컨텍스트, 진행도, 태그, 변경 파일 수, 문제 카드, 관련 파일, diff preview.
- Result: 점수, 정답 수, 태그 분포, 문항별 정오답, 해설, 관련 파일, 비로그인 저장 유도.
- History: 전체 기록 수, repository, PR title, score, submitted date, 최신순/점수순 정렬.

## 구현 순서
1. 프로젝트 초기 세팅: Next.js, TypeScript, Tailwind, Supabase, env, 기본 레이아웃.
2. 인증과 권한: 회원가입, 로그인, 로그아웃, 기록 저장/조회 보호.
3. PR 입력 흐름: 비로그인 허용, URL 파싱/검증, 생성 대기 화면.
4. GitHub PR 수집: 메타데이터, 파일 diff, 제외 파일 필터링, diff 제한.
5. AI 문제 생성: GPT-5.4 호출, Zod 검증, 문제/태그 저장, 생성 실패 처리.
6. 풀이/채점: 문제 조회, 선택 UI, 제출 검증, 로그인 저장과 비로그인 preview 분기.
7. 결과/기록: 결과 화면, 저장 CTA, 기록 목록/상세, RLS와 소유권 검증.

## 완료 기준
- 비로그인으로 PR 문제 생성, 풀이, 결과 확인이 가능하다.
- 로그인 사용자는 결과를 저장하고 기록 목록/상세를 볼 수 있다.
- 제한 초과 PR과 문제 생성 불가 PR은 OpenAI 호출 전에 차단된다.
- AI 문제는 3문항, 사후 태그, Zod 검증 규칙을 만족한다.
- 다른 사용자의 기록에 접근할 수 없다.
- Vercel 배포가 가능하다.

## 후순위
- 추천 학습, 상세 통계, 랭킹, 티어, 공개 프로필, GitHub OAuth, 비공개 repo 분석.
