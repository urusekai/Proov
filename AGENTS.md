# AGENTS.md

## Project

Proov는 GitHub PR을 바탕으로 AI가 코드 이해도 문제를 내고, 사용자가 답하면서 실력을 증명하는 개발 학습 플랫폼이다.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth/PostgreSQL
- OpenAI API GPT-5.4
- GitHub REST API
- Vercel
- Zod

## MVP Lite

- 비로그인 체험 가능, GitHub 연동 없음
- 로그인은 결과 저장/기록 조회 시 필요
- 공개 GitHub PR URL 직접 입력
- 객관식 3문항 고정
- 문제 태그는 생성 후 사후 분류하며, 사용자에게는 영어 라벨로 표시
- 해설 2문장 이내
- 관련 파일명만 표시
- diff, 변경 파일, 파일당 patch, PR 설명 제한은 `.docs/spec.md` 기준을 따른다.
- 로그인 사용자 풀이 기록 저장

## Docs

작업 전에 관련 문서를 확인한다.

- `.docs/overview.md`: 서비스 개요
- `.docs/spec.md`: 기능 범위와 화면
- `.docs/ai.md`: AI 문제 생성 정책
- `.docs/db-api.md`: DB/API 설계
- `.docs/roadmap.md`: 개발 순서
- `.docs/design.md`: 디자인 지침

## Rules

- 한국어로 응답한다.
- 기존 구조와 스타일을 우선한다.
- 요청 범위 밖 파일은 수정하지 않는다.
- 대규모 리팩토링은 하지 않는다.
- API key는 서버에서만 사용한다.
- AI 응답은 반드시 Zod로 검증한다.
- 사용자는 자기 기록만 조회할 수 있어야 한다.
- diff 제한 없이 OpenAI API를 호출하지 않는다.
- 정책/API/DB/AI 스키마가 바뀌면 관련 `.docs`도 같이 수정한다.

## Do Not

MVP에서는 GitHub OAuth, 비공개 저장소, 티어, 랭킹, 공개 프로필, 결제, 서술형 문제, 코드 라인 근거 표시를 구현하지 않는다.
