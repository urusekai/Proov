# Design Guide

## 방향
Proov는 PR 기반 코드 이해력 학습 SaaS다. 화면은 장식보다 문제, 코드 맥락, 결과가 먼저 보이게 만든다.

- 업무 도구처럼 차분하고 명확하게 구성한다.
- 불필요한 카드 중첩과 과한 장식은 피한다.
- diff, 파일명, 태그 등 개발자 친화적인 시각 언어를 사용한다.

## Layout
- 랜딩: 풀 너비 히어로 + 최대 `1248px` 중앙 정렬 섹션.
- 서비스 화면: `288px` 사이드바 + 메인 영역을 기본으로 한다.
- 문제 풀이/결과처럼 집중이 필요한 화면은 중앙 단일 컬럼을 허용한다.
- 기본 거터 `24px`, 모바일 여백 `16px`, 섹션 간격 `80px`.

## Color
| 토큰 | 값 | 용도 |
| --- | --- | --- |
| Primary | `#5323e6` | 브랜드/강조 텍스트 |
| Accent | `#6c47ff` | CTA, 활성 상태, 진행바 |
| Background | `#f8f7ff` | 기본 배경 |
| Surface | `#ffffff` | 카드/패널 |
| Lavender Tint | `#f0eeff` | 약한 강조 |
| Text | `#1c1b1b` | 주요 텍스트 |
| Muted Text | `#5d5e65` | 보조 텍스트 |

## Typography
- UI/본문: `Pretendard`
- 코드/파일명/경로/diff: `Geist Mono`
- 히어로: `48px / 700`, 모바일 `32px / 700`
- 섹션 제목: `24px / 600`
- 본문: `16px / 400`
- 보조 텍스트: `14px / 400`
- 코드: `14px / Geist Mono`

## Components

### Cards
- Radius `12px`
- 배경 `#ffffff`
- 기본 shadow: `0 4px 20px -2px rgba(108, 71, 255, 0.08)`
- 강조 shadow: `0 12px 32px -4px rgba(108, 71, 255, 0.12)`
- 페이지 전체를 카드처럼 감싸거나 카드 안에 카드를 넣지 않는다.

### Buttons
- Primary: `#6c47ff` 배경, 흰색 텍스트, `8px` radius.
- Outline/Ghost: 보라색 테두리 또는 텍스트.
- hover/focus/disabled 상태를 명확히 구분한다.

### Inputs
- 둥근 모서리와 단색 테두리를 사용한다.
- focus 시 `#6c47ff` border/ring을 적용한다.
- PR URL 입력은 충분한 폭과 명확한 placeholder를 가진다.

### Tags
- 내부 enum 대신 영어 라벨을 표시한다.
- 예: `Code Behavior`, `Data Flow`, `Error Handling`, `API Contract`
- 문제 본문보다 약하게 보이게 한다.

## Diff UI
| 상태 | 배경 | 텍스트 |
| --- | --- | --- |
| Added | `#ecfdf5` | `#10b981` |
| Removed | `#fef2f2` | `#ef4444` |

- diff, 파일명, 경로는 `Geist Mono`를 사용한다.
- `+`, `-`, 수치, 라벨 등 색상 외 신호를 함께 쓴다.
- MVP에서는 관련 파일명/경로만 표시하고 코드 라인 근거는 표시하지 않는다.

## Screen Rules
- 랜딩: PR 기반 문제 생성과 비로그인 체험 가능성을 첫 화면에서 전달한다.
- PR 입력: 공개 GitHub PR URL 입력을 중심에 둔다.
- 문제 풀이: 3문항 진행 상태, 선택 상태, 태그, 관련 파일을 명확히 보여준다.
- 결과: 점수는 `33`, `67`, `100` 중 하나이며 정답/선택/해설/관련 파일을 표시한다.
- 기록: 로그인 사용자는 자기 기록만 조회한다.

## States
- Hover: 연한 라벤더 배경 또는 shadow 증가.
- Focus: `#6c47ff` ring.
- Loading: PR 분석/문제 생성 진행 상태 표시.
- Empty: dashed border 또는 연한 배경.
- Error: 원인과 다음 행동을 짧게 안내.

## Accessibility
- 색상만으로 정답/오답/추가/삭제를 구분하지 않는다.
- 키보드 focus 상태를 명확히 표시한다.
- 모바일에서 버튼/선택지 텍스트가 넘치지 않아야 한다.
