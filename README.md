# Proov

## 프로젝트 설명

Proov는 공개 GitHub PR URL을 입력하면 AI가 PR diff를 분석해 코드 이해도 문제를 생성하는 개발 학습 플랫폼입니다. 사용자는 객관식 3문항을 풀고 정답, 짧은 해설, 관련 파일명을 확인할 수 있습니다.

MVP Lite에서는 비로그인 상태로 PR 문제 생성과 풀이를 체험할 수 있으며, 풀이 기록 저장과 기록 조회는 로그인 사용자에게 제공합니다.

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
