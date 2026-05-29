# Proov

## 프로젝트 설명

Proov는 공개 GitHub PR URL을 입력하면 AI가 PR diff를 분석해 코드 이해도 문제를 생성하는 개발 학습 플랫폼입니다. 사용자는 PR에서 생성된 객관식 문제를 한 문항씩 풀고 정답, 짧은 해설, 관련 파일명을 확인할 수 있습니다.

MVP Lite에서는 비로그인 상태로 공개 문제를 풀이할 수 있으며, PR URL 기반 문제 생성과 풀이 기록 저장/조회는 로그인 사용자에게 제공합니다.

## 기술스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth / PostgreSQL
- OpenAI API
- GitHub REST API
- Zod
- Vercel

## 디렉터리 설명

- `.docs`: 서비스 개요, 기능 명세, AI 정책, DB/API 설계, 로드맵, 디자인 지침 문서
- `.codex`: 프로젝트 작업에 사용하는 Codex 로컬 설정과 스킬
- `src/app`: Next.js App Router 기반 페이지, 레이아웃, 전역 스타일
- `src/app/auth`: 로그인, 회원가입 화면과 인증 관련 컴포넌트
- `src/app/practice`: PR URL 입력과 문제 풀이 흐름 화면
- 루트 설정 파일: Next.js, TypeScript, ESLint, Tailwind/PostCSS 설정과 패키지 관리 파일

## 백엔드 설정

1. Supabase Dashboard → **SQL Editor**에서 `supabase/schema.sql` **전체**를 실행합니다.  
   `profiles`, `problem_sets`, `questions`, `submissions`, `submission_answers` 테이블이 생겨야 풀이 기록 저장·조회가 동작합니다.
2. 테이블을 비우고 다시 올리려면 `supabase/reset.sql` 실행 후 `schema.sql`을 실행합니다.
3. `.env.local`에 `.env.example`의 값을 채웁니다.
4. `schema.sql`에 개발용 계정(`testuser@naver.com` / `testuser`)과 큐레이션 문제 시드가 포함되어 있습니다. `curated-problem-sets.ts`를 수정했다면 `npm run db:generate-seed`로 큐레이션 시드 구간을 다시 생성한 뒤 SQL Editor에서 재실행하세요.
3. OpenAI 모델명은 기본 `gpt-5.4`이며, 필요하면 `OPENAI_MODEL`로 재정의할 수 있습니다.
