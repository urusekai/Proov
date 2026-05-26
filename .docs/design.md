# Proov Unified Design Guide

## Overview
Proov은 AI 시대의 코드 이해력을 측정하고 향상시키는 SaaS 플랫폼입니다.

본 가이드는 실제 구현된 랜딩 페이지와 문제 풀이 화면을 바탕으로 수립된 시각적 표준입니다.

## Layout & Structure

| 항목 | 기준 |
| --- | --- |
| Screen Frame Width | 1920px (Desktop 기준) |
| Max Content Width | 1248px (중앙 정렬) |
| Side Padding | 24px (콘텐츠 좌우 여백) |

### Grid Strategy
- 랜딩 페이지: 풀 너비 히어로 섹션과 1248px 내 중앙 정렬 섹션의 조합
- 서비스 화면: 사이드바(288px)와 메인 작업 영역의 2열 구조 또는 중앙 집중형 카드 레이아웃

## Visual Identity

### Tone & Manner
업무 도구로서의 전문성과 SaaS 제품의 현대적인 감각을 동시에 유지합니다.

### Key Color
- Accent: `#6c47ff` (Proov Purple)
- 주요 액션, 활성 상태, 진행바 등에 사용

### Backgrounds
- 기본 배경: `#f8f7ff` (아주 연한 보라색 틴트)
- 카드/표면: `#ffffff` (Pure White)

### Typography
- 본문/UI: Pretendard - 가독성 중심의 산세리프
- 코드/기술 데이터: Geist Mono - 파일명, 경로, Diff 데이터 등

## Components

### Cards
- Radius: 12px
- Shadow: shadow-md (보라색 틴트가 섞인 은은한 그림자)
- Border: 강한 테두리 대신 그림자와 배경색 차이로 구분

### Buttons
- Primary: `#6c47ff` 배경에 흰색 텍스트, 8px 라운딩
- Outline/Ghost: 보라색 테두리 또는 텍스트만 사용

### Inputs
- 라운딩된 모서리와 깔끔한 테두리
- 포커스 시 보라색 accent 적용

## Git Diff Language

### Contextual UI
코드 분석 도구의 정체성을 살리기 위해 Diff 스타일의 시각적 언어를 활용합니다.

### Color Rules
- 추가 (Added): 초록색 텍스트 및 연한 초록색 배경
- 삭제 (Removed): 빨간색 텍스트 및 연한 빨간색 배경

### Composition
모노스페이스 폰트와 행 번호를 포함한 조밀한 레이아웃을 통해 개발자 친화적인 경험 제공

## Design Principles

### 개방형 레이아웃
불필요한 카드 중첩을 지양하고 여백을 통해 정보의 위계를 구분합니다.

### 정보 중심
장식적인 요소보다는 데이터와 코드가 돋보일 수 있는 깨끗한 인터페이스를 유지합니다.

### 일관된 리듬
섹션 간 여백과 컴포넌트 간 간격을 규격화하여 시각적 안정성을 제공합니다.
