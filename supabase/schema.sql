-- Supabase Dashboard → SQL Editor에서 이 파일 전체를 한 번 실행하세요.
-- 초기화가 필요하면 먼저 supabase/reset.sql 을 실행한 뒤 이 파일을 실행하세요.
-- 실행 후 Table Editor에 profiles, problem_sets, questions, submissions, submission_answers가 보여야 합니다.
-- 개발용 계정·큐레이션 공개 문제 19세트·문항 57개 시드가 포함됩니다.
-- curated-problem-sets.ts 변경 후: npm run db:generate-seed 로 큐레이션 시드 구간만 재생성하세요.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problem_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source_type text not null check (source_type in ('CURATED', 'GENERATED')),
  visibility text not null check (visibility in ('PUBLIC', 'PRIVATE')),
  display_title text not null,
  summary text not null,
  difficulty text not null check (difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  estimated_minutes int not null default 8,
  language_tags text[] not null default '{}',
  framework_tags text[] not null default '{}',
  library_tags text[] not null default '{}',
  topic_tags text[] not null default '{}',
  pr_url text not null,
  pr_title text not null,
  repository_owner text not null,
  repository_name text not null,
  pull_number int not null,
  base_branch text,
  head_branch text,
  ai_model text,
  raw_ai_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  problem_set_id uuid not null references public.problem_sets(id) on delete cascade,
  type text not null check (type = 'MULTIPLE_CHOICE'),
  tag text not null check (
    tag in (
      'CODE_BEHAVIOR',
      'DATA_FLOW',
      'STATE_CHANGE',
      'SIDE_EFFECT',
      'ERROR_HANDLING',
      'API_CONTRACT',
      'TEST_INTENT',
      'LOGIC_ERROR',
      'STRUCTURAL_CHANGE',
      'CONFIG_CHANGE'
    )
  ),
  question text not null,
  options jsonb not null,
  answer text not null check (answer in ('A', 'B', 'C', 'D')),
  explanation text not null,
  related_files text[] not null default '{}',
  order_index int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_set_id uuid not null references public.problem_sets(id) on delete cascade,
  score int not null check (score in (0, 33, 67, 100)),
  correct_count int not null,
  total_count int not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D')),
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null
);

alter table public.profiles enable row level security;
alter table public.problem_sets enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;

create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "problem sets public or own select" on public.problem_sets
  for select using (visibility = 'PUBLIC' or auth.uid() = user_id);
create policy "problem sets own insert" on public.problem_sets
  for insert with check (auth.uid() = user_id);

create policy "questions visible through problem set" on public.questions
  for select using (
    exists (
      select 1
      from public.problem_sets ps
      where ps.id = problem_set_id
        and (ps.visibility = 'PUBLIC' or ps.user_id = auth.uid())
    )
  );

create policy "submissions select own" on public.submissions
  for select using (auth.uid() = user_id);
create policy "submissions insert own" on public.submissions
  for insert with check (auth.uid() = user_id);

create policy "submission answers select own" on public.submission_answers
  for select using (
    exists (
      select 1
      from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );
create policy "submission answers insert own" on public.submission_answers
  for insert with check (
    exists (
      select 1
      from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );

-- @@DEV_SEED_START
-- 개발용 로그인: testuser@naver.com / testuser (닉네임 testuser)
-- 회원가입으로 만든 동일 이메일(UUID 다름)이 있으면 고정 ID 삭제만으로는 충돌합니다. 이메일 기준으로 제거합니다.
delete from auth.identities
where user_id in (select id from auth.users where email = 'testuser@naver.com');

delete from auth.users where email = 'testuser@naver.com';

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'c0ffee00-0000-4000-8000-00000000d001',
  'authenticated',
  'authenticated',
  'testuser@naver.com',
  crypt('testuser', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nickname":"testuser"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'c0ffee00-0000-4000-8000-00000000d001',
  'c0ffee00-0000-4000-8000-00000000d001',
  'c0ffee00-0000-4000-8000-00000000d001',
  '{"sub":"c0ffee00-0000-4000-8000-00000000d001","email":"testuser@naver.com"}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

insert into public.profiles (id, nickname, avatar_url)
values ('c0ffee00-0000-4000-8000-00000000d001', 'testuser', null)
on conflict (id) do update set
  nickname = excluded.nickname,
  updated_at = now();
-- @@DEV_SEED_END


-- Curated public problem sets (generated from src/data/curated-problem-sets.ts)
insert into public.problem_sets (
  id, user_id, source_type, visibility, display_title, summary, difficulty, estimated_minutes,
  language_tags, framework_tags, library_tags, topic_tags,
  pr_url, pr_title, repository_owner, repository_name, pull_number, raw_ai_response, created_at
) values
  ('7d49a081-9dc6-4631-b952-9c35ac21be86', null, 'CURATED', 'PUBLIC', 'IPv6 문자열 변환 규칙 읽기', '주소 변환 유틸리티와 회귀 테스트를 함께 읽고, 압축 조건이 결과 문자열에 미치는 영향을 파악합니다.', 'BEGINNER', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY['IPv6', 'String Formatting', 'Utility Function']::text[], 'https://github.com/honojs/hono/pull/4971', 'fix(utils/ipaddr): do not compress a single 0 group to `::`', 'honojs', 'hono', 4971, '{"curatedSlug":"hono-ipv6-string-formatting","sourceFiles":["src/utils/ipaddr.test.ts","src/utils/ipaddr.ts"]}'::jsonb, '2026-04-22T00:00:00.000Z'::timestamptz),
  ('719c621c-98c7-40a1-9376-c3c76d551bc4', null, 'CURATED', 'PUBLIC', '정적 파일 경로 정규화 흐름 이해하기', '파일 경로 유틸리티가 여러 구분자와 root 옵션을 처리하는 방식을 테스트와 함께 확인합니다.', 'BEGINNER', 8, ARRAY['TypeScript']::text[], ARRAY['Hono']::text[], ARRAY[]::text[], ARRAY['Static Files', 'Path Normalization', 'File Serving']::text[], 'https://github.com/honojs/hono/pull/4962', 'fix(serve-static): normalize all backslashes in file paths, not just the first', 'honojs', 'hono', 4962, '{"curatedSlug":"hono-static-path-normalization","sourceFiles":["src/utils/filepath.test.ts","src/utils/filepath.ts"]}'::jsonb, '2026-04-21T00:00:00.000Z'::timestamptz),
  ('760913a7-05b4-452f-972d-ac8975ac6a1f', null, 'CURATED', 'PUBLIC', 'TypeScript 미들웨어 선언 구조 정리', '런타임 로직이 아닌 타입 선언 블록 변경이 모듈 구조에 어떤 의미를 갖는지 읽습니다.', 'BEGINNER', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY['Zustand']::text[], ARRAY['Type Declarations', 'Middleware', 'DevTools']::text[], 'https://github.com/pmndrs/zustand/pull/3443', 'refactor(devtools): remove duplicate module augmentation', 'pmndrs', 'zustand', 3443, '{"curatedSlug":"zustand-devtools-type-declaration","sourceFiles":["src/middleware/devtools.ts"]}'::jsonb, '2026-04-20T00:00:00.000Z'::timestamptz),
  ('c334801f-ca77-4426-9625-03ee0d213625', null, 'CURATED', 'PUBLIC', '요청 초기화 훅의 옵션 복제 흐름', 'hook에서 옵션을 직접 바꿀 때 다음 요청으로 변경이 새지 않도록 복제하는 방식을 분석합니다.', 'INTERMEDIATE', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY['Ky']::text[], ARRAY['HTTP Client', 'Hooks', 'Request Options']::text[], 'https://github.com/sindresorhus/ky/pull/861', 'fix: isolate tuple searchParams in init hooks', 'sindresorhus', 'ky', 861, '{"curatedSlug":"ky-init-hook-search-params","sourceFiles":["source/core/Ky.ts","test/hooks.ts"]}'::jsonb, '2026-04-19T00:00:00.000Z'::timestamptz),
  ('a621a7e0-8511-4760-be3e-fda5155336df', null, 'CURATED', 'PUBLIC', 'JSON 파싱 콜백의 컨텍스트 전달', '응답 파싱 경로 여러 곳에서 사용자 정의 파서가 어떤 요청/응답 정보를 받는지 추적합니다.', 'ADVANCED', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY['Ky']::text[], ARRAY['HTTP Client', 'JSON Parsing', 'Error Handling']::text[], 'https://github.com/sindresorhus/ky/pull/849', 'Add request/response context to `parseJson` option', 'sindresorhus', 'ky', 849, '{"curatedSlug":"ky-json-parser-context","sourceFiles":["source/core/Ky.ts","source/types/options.ts","test/http-error.ts","test/main.ts"]}'::jsonb, '2026-04-18T00:00:00.000Z'::timestamptz),
  ('824a3fd3-0238-47a8-ad0a-22e60b5fa6d2', null, 'CURATED', 'PUBLIC', '폼 상태 알림의 범위 구분', '단일 필드 변경 이후 전체 값 갱신 알림이 어떤 메타데이터를 가져야 하는지 확인합니다.', 'INTERMEDIATE', 8, ARRAY['TypeScript', 'React']::text[], ARRAY['React']::text[], ARRAY['React Hook Form']::text[], ARRAY['Form State', 'Subscriptions', 'Batch Updates']::text[], 'https://github.com/react-hook-form/react-hook-form/pull/13450', 'fix(setValues): emit whole-form change without stale name/type', 'react-hook-form', 'react-hook-form', 13450, '{"curatedSlug":"react-hook-form-bulk-value-notification","sourceFiles":["src/__tests__/useForm/setValues.test.tsx","src/logic/createFormControl.ts"]}'::jsonb, '2026-04-17T00:00:00.000Z'::timestamptz),
  ('a34b165c-1095-4f9a-b040-02ffd93460a7', null, 'CURATED', 'PUBLIC', 'IPv6 CIDR 검증과 JSON Schema 패턴', '런타임 검증과 생성된 JSON Schema 정규식이 같은 입력을 허용하는지 비교합니다.', 'INTERMEDIATE', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY['Zod']::text[], ARRAY['Validation', 'JSON Schema', 'CIDR']::text[], 'https://github.com/colinhacks/zod/pull/5945', 'fix(v4): cidrv6 JSON schema pattern matches runtime', 'colinhacks', 'zod', 5945, '{"curatedSlug":"zod-cidrv6-schema-pattern","sourceFiles":["packages/zod/src/v4/classic/tests/string.test.ts","packages/zod/src/v4/core/regexes.ts"]}'::jsonb, '2026-04-16T00:00:00.000Z'::timestamptz),
  ('de1266f5-0a71-4957-b0a2-4edba7aba796', null, 'CURATED', 'PUBLIC', '객체 파싱에서 fallback 값 처리', '누락된 객체 키와 optional wrapper가 catch/default 계열 스키마와 만날 때의 결과를 추적합니다.', 'ADVANCED', 8, ARRAY['TypeScript']::text[], ARRAY[]::text[], ARRAY['Zod']::text[], ARRAY['Validation', 'Object Parsing', 'Fallback Values']::text[], 'https://github.com/colinhacks/zod/pull/5939', 'fix(v4): restore catch handling for absent object keys', 'colinhacks', 'zod', 5939, '{"curatedSlug":"zod-object-fallback-semantics","sourceFiles":["packages/zod/src/v4/classic/tests/catch.test.ts","packages/zod/src/v4/classic/tests/partial.test.ts","packages/zod/src/v4/core/schemas.ts"]}'::jsonb, '2026-04-15T00:00:00.000Z'::timestamptz),
  ('437cefe8-b5f5-4bb0-b3d2-854d066f3284', null, 'CURATED', 'PUBLIC', '응답 trailer 완료 처리 흐름', 'callback과 promise가 함께 쓰이는 비동기 완료 경로에서 첫 완료만 반영되는지 확인합니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript']::text[], ARRAY['Fastify']::text[], ARRAY[]::text[], ARRAY['HTTP Response', 'Trailers', 'Async Completion']::text[], 'https://github.com/fastify/fastify/pull/6714', 'fix: ignore duplicate trailer completions', 'fastify', 'fastify', 6714, '{"curatedSlug":"fastify-reply-trailer-completion","sourceFiles":["lib/reply.js","test/reply-trailers.test.js"]}'::jsonb, '2026-04-14T00:00:00.000Z'::timestamptz),
  ('09484372-e725-4584-8710-9d03599d1786', null, 'CURATED', 'PUBLIC', 'Content-Type 파싱 객체 재사용', '요청 처리와 request getter가 Content-Type 객체를 생성하고 재사용하는 경로를 비교합니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript']::text[], ARRAY['Fastify']::text[], ARRAY[]::text[], ARRAY['Content-Type', 'Caching', 'Request Handling']::text[], 'https://github.com/fastify/fastify/pull/6694', 'perf: cache parsed ContentType objects in ContentTypeParser', 'fastify', 'fastify', 6694, '{"curatedSlug":"fastify-content-type-parser-cache","sourceFiles":["lib/content-type-parser.js","lib/handle-request.js","lib/request.js"]}'::jsonb, '2026-04-13T00:00:00.000Z'::timestamptz),
  ('30918f4b-fd97-4342-8aef-eafc790fb6f2', null, 'CURATED', 'PUBLIC', '로그아웃 이후 사용자 상태 초기화 흐름 읽기', '라우터 가드와 로그아웃 처리에서 사용자 관련 스토어와 브라우저 저장값을 정리하는 흐름을 추적합니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript', 'Vue']::text[], ARRAY['Vue', 'Pinia']::text[], ARRAY['vue-router']::text[], ARRAY['State Management', 'Authentication', 'Routing', 'Logout Flow']::text[], 'https://github.com/urusekai/TONE/pull/145', 'Feat: 기능 추가', 'urusekai', 'TONE', 145, '{"curatedSlug":"tone-logout-user-state-reset","sourceFiles":["frontend/src/router/index.js","frontend/src/stores/dailySpectrum.js","frontend/src/stores/player.js","frontend/src/stores/resetAllUserState.js","frontend/src/stores/toast.js","frontend/src/views/MyPageView.vue","frontend/src/views/PaletteLogView.vue"]}'::jsonb, '2026-05-01T00:00:00.000Z'::timestamptz),
  ('cc402d3d-a884-4262-a292-ad5429228eb1', null, 'CURATED', 'PUBLIC', '한 곡 반복 재생 상태 흐름 이해하기', '플레이어 스토어와 오디오 이벤트 변경을 함께 읽고 반복 재생 시 현재 트랙 상태를 다시 시작하는 흐름을 파악합니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript', 'Vue']::text[], ARRAY['Vue', 'Pinia']::text[], ARRAY[]::text[], ARRAY['Audio Player', 'Playback State', 'Repeat Mode']::text[], 'https://github.com/urusekai/TONE/pull/110', 'fix: 한곡 반복 버그 수정', 'urusekai', 'TONE', 110, '{"curatedSlug":"tone-repeat-one-playback-reset","sourceFiles":["frontend/src/layouts/AppLayout.vue","frontend/src/stores/player.js","frontend/src/views/PlaylistView.vue"]}'::jsonb, '2026-04-30T00:00:00.000Z'::timestamptz),
  ('639a47e0-72d1-4fa8-bf95-65f3f66e1d44', null, 'CURATED', 'PUBLIC', '프로필 색상 상태 공유 흐름 읽기', 'Header와 MainPlayer가 공통 UI 스토어를 통해 프로필 색상을 읽고 Calendar에서 선택한 색상을 반영하는 흐름을 확인합니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript', 'Vue']::text[], ARRAY['Vue', 'Pinia']::text[], ARRAY[]::text[], ARRAY['State Management', 'Local Storage', 'Profile Color']::text[], 'https://github.com/urusekai/TONE/pull/74', 'feat:캘린더 프로필 설정 버튼 누르면 상단 우측 아바타 색상 변경 기능 추가 및 Pinia 스토어 생성', 'urusekai', 'TONE', 74, '{"curatedSlug":"tone-profile-avatar-color-store","sourceFiles":["frontend/src/components/Header.vue","frontend/src/components/MainPlayer.vue","frontend/src/stores/uiStore.js","frontend/src/views/CalendarView.vue"]}'::jsonb, '2026-04-29T00:00:00.000Z'::timestamptz),
  ('0cb24805-7c8f-499f-b0b0-01cb9806cc73', null, 'CURATED', 'PUBLIC', '회원 탈퇴 요청과 세션 정리 흐름 이해하기', '회원 탈퇴 API와 MyPage 처리 흐름이 계정 삭제, 세션 종료, 사용자 피드백을 어떻게 연결하는지 살펴봅니다.', 'INTERMEDIATE', 8, ARRAY['PHP', 'JavaScript', 'Vue']::text[], ARRAY['Vue']::text[], ARRAY[]::text[], ARRAY['Account Deletion', 'Authentication', 'Session']::text[], 'https://github.com/urusekai/TONE/pull/73', 'feat: 회원 탈퇴 구현', 'urusekai', 'TONE', 73, '{"curatedSlug":"tone-account-withdraw-session-cleanup","sourceFiles":["backend/api/auth/withdraw.php","frontend/src/services/userService.js","frontend/src/views/MyPageView.vue"]}'::jsonb, '2026-04-28T00:00:00.000Z'::timestamptz),
  ('884bd125-4f31-406b-8935-6528ddeded90', null, 'CURATED', 'PUBLIC', '로그아웃 요청과 클라이언트 상태 정리 흐름', '서버 로그아웃 API와 마이페이지의 로컬 인증 정보 정리가 어떤 순서로 연결되는지 읽습니다.', 'BEGINNER', 8, ARRAY['PHP', 'JavaScript', 'Vue']::text[], ARRAY['Vue']::text[], ARRAY[]::text[], ARRAY['Logout Flow', 'Authentication', 'Session']::text[], 'https://github.com/urusekai/TONE/pull/65', 'feat: 마이페이지에서 로그아웃 구현', 'urusekai', 'TONE', 65, '{"curatedSlug":"tone-my-page-logout-flow","sourceFiles":["backend/api/auth/logout.php","frontend/src/services/authService.js","frontend/src/views/MyPageView.vue"]}'::jsonb, '2026-04-27T00:00:00.000Z'::timestamptz),
  ('3791a4e7-deb7-4d39-8dfd-ca78fde76aa0', null, 'CURATED', 'PUBLIC', '카테고리 카드 응답 매핑 단순화 읽기', '카테고리 상세 화면에서 API 응답 필드를 카드 표시 데이터로 변환하는 과정을 단순화한 흐름을 확인합니다.', 'BEGINNER', 8, ARRAY['JavaScript', 'Vue']::text[], ARRAY['Vue']::text[], ARRAY[]::text[], ARRAY['API Response', 'Data Mapping', 'Playlist Card']::text[], 'https://github.com/urusekai/TONE/pull/100', 'refactor: API 응답을 프론트에서 정규화하는 과정을 축소', 'urusekai', 'TONE', 100, '{"curatedSlug":"tone-category-card-response-mapping","sourceFiles":["frontend/src/views/CategoryDetailView.vue"]}'::jsonb, '2026-04-26T00:00:00.000Z'::timestamptz),
  ('39312fae-6062-4bca-b251-8bd2a57ee867', null, 'CURATED', 'PUBLIC', '소셜 로그인 계정 연결 흐름 이해하기', '소셜 로그인에서 이메일과 provider 식별자를 기준으로 기존 사용자와 provider 메타데이터를 연결하는 흐름을 추적합니다.', 'ADVANCED', 8, ARRAY['JavaScript']::text[], ARRAY['Express']::text[], ARRAY['Mongoose']::text[], ARRAY['Social Login', 'Authentication', 'Account Linking', 'OAuth']::text[], 'https://github.com/muteLJS/GOREON/pull/187', 'Fix Kakao social login duplicate email handling', 'muteLJS', 'GOREON', 187, '{"curatedSlug":"goreon-social-login-account-linking","sourceFiles":["backend/src/controllers/authController.js","backend/src/models/User.js","backend/src/services/authService.js"]}'::jsonb, '2026-04-25T00:00:00.000Z'::timestamptz),
  ('38d0b8d7-a493-4e97-84e0-48a9dffc365c', null, 'CURATED', 'PUBLIC', '카카오 이메일 동의 검증 흐름 읽기', '카카오 OAuth에서 이메일 제공 동의가 profile mapping 이후 로그인 처리 전에 어떻게 검증되고 사용자 메시지로 이어지는지 확인합니다.', 'BEGINNER', 8, ARRAY['JavaScript', 'React']::text[], ARRAY['React']::text[], ARRAY[]::text[], ARRAY['Social Login', 'OAuth', 'Validation', 'Error Message']::text[], 'https://github.com/muteLJS/GOREON/pull/149', '소셜 로그인 카카오 이메일 동의항목 추가 완료', 'muteLJS', 'GOREON', 149, '{"curatedSlug":"goreon-kakao-email-consent","sourceFiles":["backend/src/services/socialOAuthService.js","frontend/src/pages/Login/Login.jsx"]}'::jsonb, '2026-04-24T00:00:00.000Z'::timestamptz),
  ('eecef31b-eedc-4824-a59d-5c592a70f42b', null, 'CURATED', 'PUBLIC', '주문 상품별 구매 확정 상태 흐름 읽기', '주문 단위와 상품 단위의 구매 확정 상태가 백엔드 모델, 라우트, 주문 내역 화면에서 어떻게 연결되는지 살펴봅니다.', 'INTERMEDIATE', 8, ARRAY['JavaScript', 'React']::text[], ARRAY['Express', 'React']::text[], ARRAY['Mongoose']::text[], ARRAY['Order Status', 'Purchase Confirmation', 'API Contract']::text[], 'https://github.com/muteLJS/GOREON/pull/154', '구매확정 버튼 수정', 'muteLJS', 'GOREON', 154, '{"curatedSlug":"goreon-order-item-confirmation","sourceFiles":["backend/src/controllers/orderController.js","backend/src/models/Order.js","backend/src/routes/orderRoutes.js","frontend/src/pages/OrderHistory/OrderHistory.jsx"]}'::jsonb, '2026-04-23T00:00:00.000Z'::timestamptz)
on conflict (id) do update set
  display_title = excluded.display_title,
  summary = excluded.summary,
  difficulty = excluded.difficulty,
  language_tags = excluded.language_tags,
  framework_tags = excluded.framework_tags,
  library_tags = excluded.library_tags,
  topic_tags = excluded.topic_tags,
  pr_url = excluded.pr_url,
  pr_title = excluded.pr_title,
  repository_owner = excluded.repository_owner,
  repository_name = excluded.repository_name,
  pull_number = excluded.pull_number,
  raw_ai_response = excluded.raw_ai_response,
  created_at = excluded.created_at;

insert into public.questions (
  id, problem_set_id, type, tag, question, options, answer, explanation, related_files, order_index
) values
  ('087cab78-2958-402d-b00c-fcfd9855fda5', '7d49a081-9dc6-4631-b952-9c35ac21be86', 'MULTIPLE_CHOICE', 'LOGIC_ERROR', '변경된 조건문은 어떤 경우에만 IPv6 섹션 배열을 '':''로 치환하도록 제한합니까?', '[{"id":"A","text":"0으로 된 구간을 하나라도 찾은 경우"},{"id":"B","text":"0으로 된 연속 구간의 길이가 2개 이상인 경우"},{"id":"C","text":"주소 문자열이 이미 ''::''를 포함하는 경우"},{"id":"D","text":"가장 긴 0 구간이 주소의 맨 앞에 있는 경우"}]'::jsonb, 'B', '조건에 `maxZeroEnd - maxZeroStart > 1`이 추가되어 연속된 0 섹션이 2개 이상일 때만 압축합니다. 단일 0 섹션은 그대로 남습니다.', ARRAY['src/utils/ipaddr.ts']::text[], 0),
  ('ee55482f-38f2-4fdc-9190-d921e72bb608', '7d49a081-9dc6-4631-b952-9c35ac21be86', 'MULTIPLE_CHOICE', 'TEST_INTENT', '추가된 테스트 케이스 중 압축이 실제로 일어나야 한다고 기대하는 입력은 무엇입니까?', '[{"id":"A","text":"1:0:2:3:4:5:6:7"},{"id":"B","text":"0:1:2:3:4:5:6:7"},{"id":"C","text":"1:2:3:4:5:6:7:0"},{"id":"D","text":"1:0:0:2:3:4:5:6"}]'::jsonb, 'D', '테스트는 `1:0:0:2:3:4:5:6`의 기대값을 `1::2:3:4:5:6`으로 추가했습니다. 나머지 단일 0 구간 입력은 원래 형태를 유지해야 합니다.', ARRAY['src/utils/ipaddr.test.ts']::text[], 1),
  ('ba4891e2-0912-4f28-98aa-24e07447b71d', '7d49a081-9dc6-4631-b952-9c35ac21be86', 'MULTIPLE_CHOICE', 'CODE_BEHAVIOR', '이번 변경 이후 `1:2:3:4:5:6:7:0`을 변환하면 테스트가 기대하는 출력은 무엇입니까?', '[{"id":"A","text":"1:2:3:4:5:6:7:0"},{"id":"B","text":"1:2:3:4:5:6:7::"},{"id":"C","text":"::1:2:3:4:5:6:7"},{"id":"D","text":"1:2:3:4:5:6::0"}]'::jsonb, 'A', '추가된 회귀 테스트는 마지막 섹션만 0인 입력을 그대로 출력하도록 기대합니다. 단일 0 구간은 압축 대상이 아닙니다.', ARRAY['src/utils/ipaddr.test.ts', 'src/utils/ipaddr.ts']::text[], 2),
  ('358efc75-d574-4b8e-9d34-8559c5bcbe7d', '719c621c-98c7-40a1-9376-c3c76d551bc4', 'MULTIPLE_CHOICE', 'LOGIC_ERROR', '파일명 정규화 코드에서 정규식 변경의 핵심 효과는 무엇입니까?', '[{"id":"A","text":"선행 ''./'' 또는 ''/'' 제거를 중단한다"},{"id":"B","text":"모든 백슬래시를 슬래시로 바꾼다"},{"id":"C","text":"root 끝의 슬래시를 유지한다"},{"id":"D","text":"파일 확장자를 자동으로 제거한다"}]'::jsonb, 'B', '`filename.replace(/\\/, ''/'')`가 `filename.replace(/\\/g, ''/'')`로 바뀌었습니다. `g` 플래그 때문에 첫 번째 항목뿐 아니라 모든 백슬래시가 치환됩니다.', ARRAY['src/utils/filepath.ts']::text[], 0),
  ('69698ced-10cb-44cd-8611-dae825b021ea', '719c621c-98c7-40a1-9376-c3c76d551bc4', 'MULTIPLE_CHOICE', 'TEST_INTENT', '새 테스트에서 `root: ''assets''`와 함께 다중 세그먼트 경로를 넘겼을 때 기대하는 결과는 무엇입니까?', '[{"id":"A","text":"foo/bar/baz.txt"},{"id":"B","text":"assets/foo/bar/baz.txt"},{"id":"C","text":"assets\\foo\\bar\\baz.txt"},{"id":"D","text":"./assets/foo/bar/baz.txt"}]'::jsonb, 'B', '추가된 테스트는 root가 있을 때 정규화된 파일명 앞에 `assets/`가 붙는 것을 확인합니다. 결과에는 백슬래시가 남지 않아야 합니다.', ARRAY['src/utils/filepath.test.ts']::text[], 1),
  ('929416bc-a858-443f-a5fa-35615eae1c36', '719c621c-98c7-40a1-9376-c3c76d551bc4', 'MULTIPLE_CHOICE', 'DATA_FLOW', '변경된 함수에서 filename에 대한 백슬래시 치환은 어떤 처리 이후에 수행됩니까?', '[{"id":"A","text":"root의 마지막 슬래시를 제거한 이후"},{"id":"B","text":"선행 ''./'', ''/'', ''\\'' 패턴을 제거한 이후"},{"id":"C","text":"default document를 붙인 이후"},{"id":"D","text":"파일 존재 여부를 확인한 이후"}]'::jsonb, 'B', 'diff에서 백슬래시 치환은 `filename.replace(/^\.?[\/\\]/, '''')` 다음 줄에 위치합니다. root 정리는 그 이후에 수행됩니다.', ARRAY['src/utils/filepath.ts']::text[], 2),
  ('758abb47-3de6-41e1-8072-9958ab2d90c8', '760913a7-05b4-452f-972d-ac8975ac6a1f', 'MULTIPLE_CHOICE', 'STRUCTURAL_CHANGE', '이번 변경에서 `src/middleware/devtools.ts`에서 제거된 블록의 성격으로 가장 알맞은 것은 무엇입니까?', '[{"id":"A","text":"Redux DevTools와 연결하는 런타임 함수"},{"id":"B","text":"`../vanilla` 모듈에 대한 TypeScript module augmentation"},{"id":"C","text":"상태 변경을 기록하는 테스트 헬퍼"},{"id":"D","text":"브라우저 확장 프로그램을 감지하는 조건문"}]'::jsonb, 'B', '삭제된 코드는 `declare module ''../vanilla''`로 시작하는 타입 선언 블록입니다. 실행 로직이나 테스트 코드는 제거되지 않았습니다.', ARRAY['src/middleware/devtools.ts']::text[], 0),
  ('a4c5ffb1-9778-4cc1-a76c-0142d1b7f61d', '760913a7-05b4-452f-972d-ac8975ac6a1f', 'MULTIPLE_CHOICE', 'API_CONTRACT', '삭제된 `StoreMutators` 선언이 연결하던 mutator key는 무엇입니까?', '[{"id":"A","text":"zustand/persist"},{"id":"B","text":"zustand/immer"},{"id":"C","text":"zustand/devtools"},{"id":"D","text":"zustand/subscribeWithSelector"}]'::jsonb, 'C', '삭제된 인터페이스 안에는 `''zustand/devtools'': WithDevtools<S>` 항목이 있었습니다. 이 키가 devtools 미들웨어의 타입 확장 지점입니다.', ARRAY['src/middleware/devtools.ts']::text[], 1),
  ('719294f1-8367-40de-9763-ed2b55191e69', '760913a7-05b4-452f-972d-ac8975ac6a1f', 'MULTIPLE_CHOICE', 'CODE_BEHAVIOR', '이 diff만 기준으로 볼 때, 변경이 직접 수정한 런타임 동작은 무엇입니까?', '[{"id":"A","text":"상태 업데이트 시 devtools 메시지를 두 번 보내지 않도록 했다"},{"id":"B","text":"브라우저 확장 연결 실패 시 fallback을 추가했다"},{"id":"C","text":"런타임 동작은 직접 바꾸지 않고 타입 선언 중복만 제거했다"},{"id":"D","text":"devtoolsOptions 기본값을 새로 지정했다"}]'::jsonb, 'C', 'diff는 선언 블록 삭제만 포함하며 함수 본문 변경이 없습니다. 따라서 직접적인 런타임 분기 변화는 이 patch에서 보이지 않습니다.', ARRAY['src/middleware/devtools.ts']::text[], 2),
  ('6571cf29-0955-4234-a176-a0bc9bd7f57a', 'c334801f-ca77-4426-9625-03ee0d213625', 'MULTIPLE_CHOICE', 'DATA_FLOW', '새로 추가된 `cloneSearchParametersForInitHook`는 searchParams가 배열일 때 어떤 방식으로 값을 복제합니까?', '[{"id":"A","text":"원본 배열을 그대로 반환한다"},{"id":"B","text":"각 tuple을 spread로 새 배열로 만들어 반환한다"},{"id":"C","text":"URLSearchParams 문자열로 변환해 반환한다"},{"id":"D","text":"배열인 경우 undefined를 반환한다"}]'::jsonb, 'B', '배열인 경우 `searchParameters.map(parameter => [...parameter])`로 각 내부 tuple까지 새 배열로 복제합니다. 배열이 아닌 경우에는 기존 shallow clone 흐름을 사용합니다.', ARRAY['source/core/Ky.ts']::text[], 0),
  ('6a9137bf-707d-4f53-959f-7f5157e01943', 'c334801f-ca77-4426-9625-03ee0d213625', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '추가된 테스트에서 init hook이 첫 번째 tuple 값을 바꾼 뒤, 두 요청에서 관찰해야 하는 초기값 배열은 무엇입니까?', '[{"id":"A","text":"[''seed'', ''seed'']"},{"id":"B","text":"[''seed'', ''1'']"},{"id":"C","text":"[''1'', ''2'']"},{"id":"D","text":"[''2'', ''2'']"}]'::jsonb, 'A', '테스트는 `seenInitialValues`가 두 요청 모두 `seed`로 시작해야 한다고 검증합니다. 이는 첫 요청의 in-place mutation이 다음 요청의 초기 옵션에 남지 않는다는 뜻입니다.', ARRAY['test/hooks.ts']::text[], 1),
  ('c7db4fd3-b0cc-4cd1-8ae1-632e9a46d4f8', 'c334801f-ca77-4426-9625-03ee0d213625', 'MULTIPLE_CHOICE', 'TEST_INTENT', '새 테스트에서 실제 fetch로 전달된 URL의 `requestId` 값들은 어떤 순서로 기록되어야 합니까?', '[{"id":"A","text":"[''seed'', ''seed'']"},{"id":"B","text":"[''1'', ''2'']"},{"id":"C","text":"[''2'', ''1'']"},{"id":"D","text":"[''seed'', ''2'']"}]'::jsonb, 'B', 'init hook은 각 요청마다 `requestIdentifier`를 증가시켜 tuple 값을 바꿉니다. 따라서 fetch 단계에서 본 `requestId`는 첫 요청 1, 두 번째 요청 2입니다.', ARRAY['test/hooks.ts']::text[], 2),
  ('44e713f5-37dc-4abe-8657-abdefd39a682', 'a621a7e0-8511-4760-be3e-fda5155336df', 'MULTIPLE_CHOICE', 'API_CONTRACT', '`parseJson` 옵션의 타입 시그니처는 이번 변경 이후 어떤 두 번째 인자를 받도록 바뀌었습니까?', '[{"id":"A","text":"{url: string; status: number}"},{"id":"B","text":"{request: Request; response: Response}"},{"id":"C","text":"{options: Options; retryCount: number}"},{"id":"D","text":"{headers: Headers; body: string}"}]'::jsonb, 'B', '타입 정의가 `(text: string, context: {request: Request; response: Response}) => unknown` 형태로 변경되었습니다. 주석에서도 options는 의도적으로 context에 포함하지 않는다고 설명합니다.', ARRAY['source/types/options.ts']::text[], 0),
  ('a1299dd1-ea4b-45d4-8e10-dfc494367b8c', 'a621a7e0-8511-4760-be3e-fda5155336df', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`.json()` shortcut 경로에서 사용자 정의 `parseJson`을 호출할 때 전달되는 request 값은 무엇입니까?', '[{"id":"A","text":"새로 생성한 빈 Request"},{"id":"B","text":"ky.request"},{"id":"C","text":"response.url로 다시 만든 Request"},{"id":"D","text":"undefined"}]'::jsonb, 'B', 'Ky 클래스의 `.json()` 처리 경로에서 `options.parseJson(text, {request: ky.request, response})`로 호출하도록 바뀌었습니다. response 객체도 같은 context에 포함됩니다.', ARRAY['source/core/Ky.ts']::text[], 1),
  ('f8cb1248-4536-4c04-b3a2-3f8413bbfe44', 'a621a7e0-8511-4760-be3e-fda5155336df', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '추가된 retry 관련 테스트에서 `parseJson`이 기록하는 response status 순서는 무엇입니까?', '[{"id":"A","text":"[200]"},{"id":"B","text":"[500]"},{"id":"C","text":"[500, 200]"},{"id":"D","text":"[200, 500]"}]'::jsonb, 'C', '테스트는 첫 요청의 500 응답과 재시도 후 200 응답 모두에서 parseJson context를 관찰합니다. 기대값은 `[500, 200]`입니다.', ARRAY['test/main.ts', 'source/core/Ky.ts']::text[], 2),
  ('c9ab4fde-319b-4027-aeb9-99980a44b4ba', '824a3fd3-0238-47a8-ad0a-22e60b5fa6d2', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '`setValues`의 마지막 state notification에서 이번 변경이 명시적으로 undefined로 설정하는 필드는 무엇입니까?', '[{"id":"A","text":"name과 type"},{"id":"B","text":"errors와 touchedFields"},{"id":"C","text":"isDirty와 isValid"},{"id":"D","text":"defaultValues와 disabled"}]'::jsonb, 'A', '`_subjects.state.next`에 전달하는 객체가 `name: undefined`, `type: undefined`를 포함하도록 바뀌었습니다. values는 `_formValues`를 그대로 담습니다.', ARRAY['src/logic/createFormControl.ts']::text[], 0),
  ('fbbdbbd5-c938-44f7-885d-b9acc5e6f245', '824a3fd3-0238-47a8-ad0a-22e60b5fa6d2', 'MULTIPLE_CHOICE', 'TEST_INTENT', '추가된 테스트가 stale 메타데이터 상황을 만들기 위해 먼저 수행하는 동작은 무엇입니까?', '[{"id":"A","text":"폼을 unmount한 뒤 다시 mount한다"},{"id":"B","text":"`a` 필드를 register하고 `setValue(''a'', ''changed'', { shouldValidate: true })`를 호출한다"},{"id":"C","text":"reset으로 defaultValues를 모두 비운다"},{"id":"D","text":"watch 구독자를 제거한 뒤 setValues를 호출한다"}]'::jsonb, 'B', '테스트는 먼저 단일 필드 변경을 발생시켜 `_formState.name/type`이 이전 필드 정보를 가질 수 있는 상황을 만듭니다. 이후 `setValues`의 마지막 알림을 검증합니다.', ARRAY['src/__tests__/useForm/setValues.test.tsx']::text[], 1),
  ('75418846-8012-47f0-8668-7b50d5248e4c', '824a3fd3-0238-47a8-ad0a-22e60b5fa6d2', 'MULTIPLE_CHOICE', 'SIDE_EFFECT', '회귀 테스트에서 마지막 values notification의 `values`로 기대하는 객체는 무엇입니까?', '[{"id":"A","text":"{ a: ''changed'', b: ''2'' }"},{"id":"B","text":"{ a: ''10'', b: ''20'' }"},{"id":"C","text":"{ name: undefined, type: undefined }"},{"id":"D","text":"{ a: ''1'', b: ''2'' }"}]'::jsonb, 'B', '테스트는 `setValues({ a: ''10'', b: ''20'' })` 이후 terminal notification의 values가 이 새 값 전체와 같아야 한다고 검증합니다. name/type은 별도 메타데이터로 undefined여야 합니다.', ARRAY['src/__tests__/useForm/setValues.test.tsx', 'src/logic/createFormControl.ts']::text[], 2),
  ('fd329f1f-f594-40b8-90d4-2067086bb521', 'a34b165c-1095-4f9a-b040-02ffd93460a7', 'MULTIPLE_CHOICE', 'TEST_INTENT', '새 테스트가 `z.toJSONSchema(cidrV6).pattern`으로 만든 RegExp에 대해 확인하는 동작은 무엇입니까?', '[{"id":"A","text":"유효한 CIDR v6 예시들이 pattern에도 매칭되는지 확인한다"},{"id":"B","text":"CIDR v4 주소를 CIDR v6로 자동 변환하는지 확인한다"},{"id":"C","text":"prefix가 없는 IPv6 주소도 허용하는지 확인한다"},{"id":"D","text":"모든 입력을 소문자로 변환하는지 확인한다"}]'::jsonb, 'A', '테스트는 JSON Schema pattern으로 RegExp를 만든 뒤 여러 CIDR v6 입력에 대해 `pattern.test(input)`이 true인지 검증합니다. 런타임 safeParse와 schema pattern의 허용 범위를 맞추려는 테스트입니다.', ARRAY['packages/zod/src/v4/classic/tests/string.test.ts']::text[], 0),
  ('a5c7f734-98f8-44b2-9513-8732021889cf', 'a34b165c-1095-4f9a-b040-02ffd93460a7', 'MULTIPLE_CHOICE', 'API_CONTRACT', '추가된 테스트 입력 중 JSON Schema pattern 매칭까지 확인하는 예시는 무엇입니까?', '[{"id":"A","text":"2001:db8::"},{"id":"B","text":"2001:db8::/32"},{"id":"C","text":"localhost/128"},{"id":"D","text":"999.999.999.999/32"}]'::jsonb, 'B', '반복문에는 `2001:db8::/32` 같은 CIDR v6 문자열이 포함됩니다. prefix가 없는 `2001:db8::`는 기존 invalid 섹션에서 다루는 형태입니다.', ARRAY['packages/zod/src/v4/classic/tests/string.test.ts']::text[], 1),
  ('94864247-d5db-4a55-8168-1e0d8994f234', 'a34b165c-1095-4f9a-b040-02ffd93460a7', 'MULTIPLE_CHOICE', 'LOGIC_ERROR', 'core regex 변경의 방향으로 가장 알맞은 설명은 무엇입니까?', '[{"id":"A","text":"CIDR v6 정규식을 제거하고 항상 통과시킨다"},{"id":"B","text":"압축된 IPv6 주소 형태를 더 세분화해 매칭하도록 정규식을 확장한다"},{"id":"C","text":"prefix 범위를 0-32로 줄인다"},{"id":"D","text":"대문자 16진수 입력을 금지한다"}]'::jsonb, 'B', '새 정규식은 여러 압축 IPv6 형태를 대안 패턴으로 세분화해 나열합니다. prefix 범위나 16진수 대소문자 허용 자체가 핵심 변경은 아닙니다.', ARRAY['packages/zod/src/v4/core/regexes.ts']::text[], 2),
  ('49363b7d-c6df-4c63-8463-b377aa435310', 'de1266f5-0a71-4957-b0a2-4edba7aba796', 'MULTIPLE_CHOICE', 'API_CONTRACT', '`$ZodCatch` 초기화에서 optin 처리 방식은 어떻게 바뀌었습니까?', '[{"id":"A","text":"innerType의 optin을 lazy로 그대로 따른다"},{"id":"B","text":"항상 optional로 설정한다"},{"id":"C","text":"항상 undefined로 설정한다"},{"id":"D","text":"object schema에서만 optional로 설정한다"}]'::jsonb, 'B', '`util.defineLazy(..., () => def.innerType._zod.optin)`이 제거되고 `inst._zod.optin = ''optional''`이 추가되었습니다. catch 스키마가 누락 입력을 처리할 수 있음을 object 파서에 알리는 변경입니다.', ARRAY['packages/zod/src/v4/core/schemas.ts']::text[], 0),
  ('7feae5fa-668e-46a6-8762-633d87ad6c08', 'de1266f5-0a71-4957-b0a2-4edba7aba796', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '새로 추가된 `caught` 플래그는 어느 상황에서 true로 설정됩니까?', '[{"id":"A","text":"optional이 undefined를 즉시 반환할 때"},{"id":"B","text":"$ZodCatch가 catchValue로 payload 값을 대체할 때"},{"id":"C","text":"JSON Schema를 생성할 때 required 배열을 만들 때"},{"id":"D","text":"parse가 성공했지만 issue가 없을 때마다"}]'::jsonb, 'B', '$ZodCatch의 동기/비동기 처리 모두에서 catchValue가 적용된 뒤 `payload.caught = true`가 설정됩니다. optional wrapper는 이 플래그를 보고 undefined 입력 처리 방식을 결정합니다.', ARRAY['packages/zod/src/v4/core/schemas.ts']::text[], 1),
  ('89cbf3f7-35aa-490a-8580-fd0327c159b1', 'de1266f5-0a71-4957-b0a2-4edba7aba796', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '변경된 `handleOptionalResult`가 undefined 입력에서 undefined를 반환하는 조건은 무엇입니까?', '[{"id":"A","text":"input이 undefined이고 issues가 있거나 caught가 true인 경우"},{"id":"B","text":"input이 undefined이기만 하면 항상"},{"id":"C","text":"caught가 false이고 issues가 없을 때만"},{"id":"D","text":"input이 null이고 caught가 true인 경우"}]'::jsonb, 'A', '조건이 `input === undefined && (result.issues.length || result.caught)`로 확장되었습니다. 이로써 catch가 값을 만들었더라도 outer optional은 원래 undefined 입력을 short-circuit할 수 있습니다.', ARRAY['packages/zod/src/v4/core/schemas.ts']::text[], 2),
  ('dcbae625-5ddc-4005-96b8-b9cc05dbf370', '437cefe8-b5f5-4bb0-b3d2-854d066f3284', 'MULTIPLE_CHOICE', 'SIDE_EFFECT', '`sendTrailer` 내부 callback에 추가된 `cbAlreadyCalled` 플래그의 역할은 무엇입니까?', '[{"id":"A","text":"첫 호출 이후 같은 callback의 추가 호출을 무시한다"},{"id":"B","text":"trailer 이름을 모두 소문자로 바꾼다"},{"id":"C","text":"payload를 JSON으로 직렬화한다"},{"id":"D","text":"에러가 있으면 응답 상태를 500으로 바꾼다"}]'::jsonb, 'A', 'callback 시작 부분에 이미 호출되었으면 return하는 guard가 추가되었습니다. 첫 호출에서는 플래그를 true로 바꾸고 기존 처리로 진행합니다.', ARRAY['lib/reply.js']::text[], 0),
  ('13aea348-157c-487e-a232-6c2c2a5f8055', '437cefe8-b5f5-4bb0-b3d2-854d066f3284', 'MULTIPLE_CHOICE', 'TEST_INTENT', '추가된 테스트의 `Mixed` trailer handler는 어떤 두 완료 경로를 함께 사용합니까?', '[{"id":"A","text":"callback으로 ''correct''를 전달하고 Promise로 ''corrupted''를 반환한다"},{"id":"B","text":"callback으로 에러를 전달하고 undefined를 반환한다"},{"id":"C","text":"두 개의 setTimeout callback만 등록한다"},{"id":"D","text":"stream 이벤트와 header 이벤트를 함께 사용한다"}]'::jsonb, 'A', '테스트의 Mixed handler는 `done(null, ''correct'')`를 먼저 호출하고 `Promise.resolve(''corrupted'')`를 반환합니다. 기대값은 첫 완료인 correct가 유지되는 것입니다.', ARRAY['test/reply-trailers.test.js']::text[], 1),
  ('c45d7226-2140-4dad-9095-49e42978f46d', '437cefe8-b5f5-4bb0-b3d2-854d066f3284', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '새 테스트에서 응답 검증 시 `res.trailers.mixed`의 기대값은 무엇입니까?', '[{"id":"A","text":"correct"},{"id":"B","text":"corrupted"},{"id":"C","text":"undefined"},{"id":"D","text":"mixed"}]'::jsonb, 'A', '테스트는 mixed trailer가 `correct`인지 검증합니다. Promise가 뒤늦게 반환한 값은 callback guard 때문에 결과를 덮어쓰지 않아야 합니다.', ARRAY['test/reply-trailers.test.js', 'lib/reply.js']::text[], 2),
  ('643172a3-2e43-40d4-953b-7963618d95c4', '09484372-e725-4584-8710-9d03599d1786', 'MULTIPLE_CHOICE', 'STRUCTURAL_CHANGE', '`ContentTypeParser` 생성자에 새로 추가된 캐시 필드는 무엇으로 초기화됩니까?', '[{"id":"A","text":"new Fifo(100)"},{"id":"B","text":"new Lru(100)"},{"id":"C","text":"new Map()"},{"id":"D","text":"Object.create(null)"}]'::jsonb, 'B', '`toad-cache`에서 `LruMap`을 `Lru`로 import하고 `this.ctCache = new Lru(100)`을 추가했습니다. 기존 parser cache는 계속 Fifo를 사용합니다.', ARRAY['lib/content-type-parser.js']::text[], 0),
  ('64893537-3c89-48e5-84e8-fe6838757739', '09484372-e725-4584-8710-9d03599d1786', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`getContentType(raw)`의 처리 흐름으로 가장 알맞은 것은 무엇입니까?', '[{"id":"A","text":"항상 새 ContentType을 만든 뒤 캐시를 비운다"},{"id":"B","text":"캐시에서 raw 값을 조회하고, 없으면 새 ContentType을 만들어 저장 후 반환한다"},{"id":"C","text":"raw 값이 있으면 undefined를 반환한다"},{"id":"D","text":"mediaType 문자열만 캐시에 저장한다"}]'::jsonb, 'B', '메서드는 먼저 `this.ctCache.get(raw)`를 확인하고 값이 있으면 바로 반환합니다. 없으면 `new ContentType(raw)`를 만든 뒤 같은 raw 키로 캐시에 저장합니다.', ARRAY['lib/content-type-parser.js']::text[], 1),
  ('c98b9344-2a0a-4f44-a0a7-09db4ec4c258', '09484372-e725-4584-8710-9d03599d1786', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '변경 후 request의 `mediaType` getter는 ContentType 객체를 어디에서 가져옵니까?', '[{"id":"A","text":"직접 `new ContentType(this.headers[''content-type''])`를 호출한다"},{"id":"B","text":"route context의 contentTypeParser가 제공하는 `getContentType`을 호출한다"},{"id":"C","text":"전역 singleton parser에서 가져온다"},{"id":"D","text":"reply 객체에 저장된 parser를 사용한다"}]'::jsonb, 'B', 'getter는 이제 `this[kRouteContext].contentTypeParser.getContentType(...)`를 호출합니다. handle-request 경로도 같은 메서드를 사용하도록 바뀌었습니다.', ARRAY['lib/request.js', 'lib/handle-request.js']::text[], 2),
  ('9c809c20-33de-4dfc-ab9c-9faddef1d6b1', '30918f4b-fd97-4342-8aef-eafc790fb6f2', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '새로 추가된 `resetAllUserState`가 직접 초기화하거나 제거하는 대상으로 가장 알맞은 것은 무엇입니까?', '[{"id":"A","text":"auth, dailySpectrum, player 등 사용자 스토어와 sessionStorage/localStorage 일부 키"},{"id":"B","text":"라우터 history 전체와 모든 브라우저 cookie"},{"id":"C","text":"palette log 목록만 비우고 로그인 정보는 유지"},{"id":"D","text":"서버 세션을 삭제한 뒤 페이지를 새로고침"}]'::jsonb, 'A', '`resetAllUserState`는 여러 Pinia 스토어를 초기화하고 `sessionStorage.clear()`와 지정된 localStorage 키 제거를 수행합니다. 서버 세션 삭제나 cookie 정리는 이 diff에 포함되지 않습니다.', ARRAY['frontend/src/stores/resetAllUserState.js']::text[], 0),
  ('a3355111-7b02-43f8-8081-431a818c8961', '30918f4b-fd97-4342-8aef-eafc790fb6f2', 'MULTIPLE_CHOICE', 'DATA_FLOW', '라우터 가드 변경 후 서버 세션이 없다고 판단되면 로그인 리다이렉트 전에 어떤 처리가 추가로 수행됩니까?', '[{"id":"A","text":"현재 route의 query를 모두 제거한다"},{"id":"B","text":"`resetAllUserState()`를 호출해 클라이언트 사용자 상태를 정리한다"},{"id":"C","text":"세션 확인 요청을 한 번 더 재시도한다"},{"id":"D","text":"로그아웃 API를 호출한 뒤 홈으로 이동한다"}]'::jsonb, 'B', '가드는 `hasServerSession()` 결과가 false이면 `resetAllUserState()`를 호출한 다음 `/login`으로 이동합니다. 세션이 있으면 기존처럼 `true`를 반환합니다.', ARRAY['frontend/src/router/index.js', 'frontend/src/stores/resetAllUserState.js']::text[], 1),
  ('842449fe-2727-4c9c-a517-52172734c27d', '30918f4b-fd97-4342-8aef-eafc790fb6f2', 'MULTIPLE_CHOICE', 'CODE_BEHAVIOR', '`toast` 스토어에 추가된 `reset()`은 예약된 표시 처리와 현재 메시지를 어떻게 다룹니까?', '[{"id":"A","text":"예약된 animationFrame이 있으면 취소하고 open을 false, message를 빈 문자열로 바꾼다"},{"id":"B","text":"현재 메시지는 유지하고 open 값만 false로 바꾼다"},{"id":"C","text":"새 animationFrame을 예약해 토스트를 다시 표시한다"},{"id":"D","text":"toast store의 `$reset`만 호출하고 별도 필드는 건드리지 않는다"}]'::jsonb, 'A', '`reset()`은 `openFrameId`가 있으면 `cancelAnimationFrame`으로 취소하고 id를 null로 되돌립니다. 이후 `open`을 false로, `message`를 빈 문자열로 설정합니다.', ARRAY['frontend/src/stores/toast.js', 'frontend/src/stores/resetAllUserState.js']::text[], 2),
  ('158b31ee-2a9f-446e-b3f5-0ae270f10418', 'cc402d3d-a884-4262-a292-ad5429228eb1', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '`replayCurrentTrack()`가 현재 트랙을 다시 재생하기 위해 직접 변경하는 상태 조합은 무엇입니까?', '[{"id":"A","text":"`current_time`과 `seek_request_time`을 0으로 두고 `is_playing`을 true로 설정한다"},{"id":"B","text":"`current_index`를 -1로 바꾸고 queue를 비운다"},{"id":"C","text":"`repeat_mode`를 off로 바꾸고 다음 트랙을 재생한다"},{"id":"D","text":"`duration`만 0으로 초기화하고 재생 상태는 유지한다"}]'::jsonb, 'A', '새 함수는 현재 재생 위치와 seek 요청 시간을 0으로 맞추고 재생 상태를 true로 바꿉니다. 현재 트랙이 없거나 index가 유효하지 않으면 바로 반환합니다.', ARRAY['frontend/src/stores/player.js']::text[], 0),
  ('22012a85-f82a-4686-a018-3382e281c03f', 'cc402d3d-a884-4262-a292-ad5429228eb1', 'MULTIPLE_CHOICE', 'CODE_BEHAVIOR', '변경 후 `is_repeat_one` 상태에서 다음/이전 재생 흐름이 선택하는 동작은 무엇입니까?', '[{"id":"A","text":"현재 index를 다시 `playTrackAt`으로 선택한다"},{"id":"B","text":"현재 트랙을 `replayCurrentTrack()`으로 처음부터 다시 시작한다"},{"id":"C","text":"셔플 목록에서 임의 트랙을 선택한다"},{"id":"D","text":"반복 모드를 해제한 뒤 일반 다음 곡으로 이동한다"}]'::jsonb, 'B', '`playNext`와 `playPrev`의 반복 1곡 분기 모두 `playTrackAt` 호출에서 `replayCurrentTrack()` 호출로 바뀌었습니다. 이는 현재 트랙 선택을 다시 만들기보다 재생 위치를 되돌리는 흐름입니다.', ARRAY['frontend/src/stores/player.js']::text[], 1),
  ('d7c073de-310b-48df-bc2a-34e34d60aa06', 'cc402d3d-a884-4262-a292-ad5429228eb1', 'MULTIPLE_CHOICE', 'DATA_FLOW', '이번 변경에서 트랙 길이 정보가 플레이어까지 전달되도록 추가된 필드는 무엇입니까?', '[{"id":"A","text":"`duration_ms`"},{"id":"B","text":"`play_count`"},{"id":"C","text":"`repeat_mode`"},{"id":"D","text":"`seek_request_time`"}]'::jsonb, 'A', '기본 트랙, normalizeTrack, AppLayout/PlaylistView의 변환 객체에 `duration_ms`가 추가되었습니다. AppLayout은 metadata와 durationchange 이벤트에서 audio duration을 플레이어에 반영합니다.', ARRAY['frontend/src/stores/player.js', 'frontend/src/layouts/AppLayout.vue', 'frontend/src/views/PlaylistView.vue']::text[], 2),
  ('8479bb5c-0581-4670-9962-c8f927d0ad9d', '639a47e0-72d1-4fa8-bf95-65f3f66e1d44', 'MULTIPLE_CHOICE', 'STRUCTURAL_CHANGE', 'Header와 MainPlayer에서 프로필 색상을 읽는 방식은 어떤 구조로 바뀌었습니까?', '[{"id":"A","text":"각 컴포넌트가 직접 localStorage를 파싱하는 방식에서 `useUiStore()`의 `avatarColor`를 읽는 방식"},{"id":"B","text":"라우터 meta에 색상을 저장하고 route 변경 때만 읽는 방식"},{"id":"C","text":"CSS 변수만 사용하고 JavaScript 상태를 제거하는 방식"},{"id":"D","text":"서버 API를 매 렌더링마다 호출하는 방식"}]'::jsonb, 'A', '두 컴포넌트의 localStorage 파싱 함수가 제거되고 `useUiStore`를 사용하도록 바뀌었습니다. 표시 색상도 `uiStore.avatarColor`를 참조합니다.', ARRAY['frontend/src/components/Header.vue', 'frontend/src/components/MainPlayer.vue', 'frontend/src/stores/uiStore.js']::text[], 0),
  ('d8b3ff44-0a9a-4883-8986-7b5d3dcb90ce', '639a47e0-72d1-4fa8-bf95-65f3f66e1d44', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '`uiStore.setAvatarColor(color)`가 색상을 저장할 때 수행하는 동작으로 가장 알맞은 것은 무엇입니까?', '[{"id":"A","text":"빈 문자열이면 그대로 저장하고 기본 색상은 사용하지 않는다"},{"id":"B","text":"상태 값을 갱신하고 `avatarColor` 및 `tone_current_user.profileColor` 저장을 시도한다"},{"id":"C","text":"오직 Pinia 상태만 바꾸고 localStorage에는 접근하지 않는다"},{"id":"D","text":"색상 저장 후 라우터를 프로필 페이지로 이동시킨다"}]'::jsonb, 'B', '`setAvatarColor`는 유효한 문자열이 아니면 기본 색상으로 보정한 뒤 `avatarColor.value`를 갱신합니다. 이어 `persistAvatarColor`가 legacy 키와 current user 객체를 localStorage에 반영합니다.', ARRAY['frontend/src/stores/uiStore.js']::text[], 1),
  ('72a2d6bf-2133-43a2-a6a5-a454042f9f06', '639a47e0-72d1-4fa8-bf95-65f3f66e1d44', 'MULTIPLE_CHOICE', 'DATA_FLOW', 'Calendar 화면의 프로필 설정 버튼은 선택된 날짜 색상을 어떤 경로로 반영합니까?', '[{"id":"A","text":"`uiStore.setAvatarColor(selectedData.color)`를 호출한다"},{"id":"B","text":"Header 컴포넌트의 내부 ref를 직접 수정한다"},{"id":"C","text":"`profileColorChange` 이벤트만 dispatch하고 스토어는 사용하지 않는다"},{"id":"D","text":"서버에 색상을 저장한 뒤 응답을 기다린다"}]'::jsonb, 'A', '템플릿의 프로필 설정 버튼에 `@click="uiStore.setAvatarColor(selectedData.color)"`가 추가되었습니다. Header와 MainPlayer는 같은 스토어 값을 읽어 색상을 표시합니다.', ARRAY['frontend/src/views/CalendarView.vue', 'frontend/src/stores/uiStore.js']::text[], 2),
  ('3c197096-90c9-4156-abd9-fd5fb84e633c', '0cb24805-7c8f-499f-b0b0-01cb9806cc73', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '`withdraw.php`에서 로그인한 사용자 식별값이 세션에 없을 때 반환하는 응답은 무엇입니까?', '[{"id":"A","text":"401 상태와 ''로그인이 필요합니다.'' 메시지"},{"id":"B","text":"204 상태와 빈 응답"},{"id":"C","text":"200 상태와 success true"},{"id":"D","text":"404 상태와 ''삭제할 회원 정보를 찾을 수 없습니다.'' 메시지"}]'::jsonb, 'A', '세션의 `user_uuid`가 비어 있으면 401 응답과 로그인 필요 메시지를 반환합니다. 404는 삭제 대상 사용자를 찾지 못한 경우에 사용됩니다.', ARRAY['backend/api/auth/withdraw.php']::text[], 0),
  ('bbbaf11f-d4ff-4f67-95f8-734e3a2336a0', '0cb24805-7c8f-499f-b0b0-01cb9806cc73', 'MULTIPLE_CHOICE', 'SIDE_EFFECT', '회원 삭제가 성공한 뒤 백엔드가 수행하는 세션 관련 처리는 무엇입니까?', '[{"id":"A","text":"세션 배열을 비우고 세션 쿠키를 만료시킨 뒤 `session_destroy()`를 호출한다"},{"id":"B","text":"새 access token을 발급하고 기존 세션은 유지한다"},{"id":"C","text":"localStorage의 사용자 키를 서버에서 직접 제거한다"},{"id":"D","text":"DELETE 요청으로 다시 한 번 같은 API를 호출한다"}]'::jsonb, 'A', '삭제 성공 후 `$_SESSION = []`로 비우고 세션 쿠키를 과거 시각으로 설정합니다. 마지막에는 `session_destroy()`를 호출하고 success 응답을 보냅니다.', ARRAY['backend/api/auth/withdraw.php']::text[], 1),
  ('483d24a0-22c7-4ab5-a155-3ffe8fa7b6f1', '0cb24805-7c8f-499f-b0b0-01cb9806cc73', 'MULTIPLE_CHOICE', 'DATA_FLOW', '프론트의 탈퇴 확인 흐름에서 `withdrawMyAccount()` 성공 후 이어지는 처리는 무엇입니까?', '[{"id":"A","text":"탈퇴 모달을 닫고 완료 알림을 표시한 뒤 로그인 화면으로 이동하는 정리 함수를 호출한다"},{"id":"B","text":"프로필 조회 API를 다시 호출하고 마이페이지에 머문다"},{"id":"C","text":"오류 알림만 표시하고 모달 상태는 그대로 둔다"},{"id":"D","text":"회원 탈퇴 API 호출 없이 TODO 주석만 남긴다"}]'::jsonb, 'A', '성공 시 `isWithdrawOpen`을 false로 바꾸고 완료 alert 후 `clearAuthAndGoLogin()`을 호출합니다. 실패 시에는 에러 메시지를 alert로 보여줍니다.', ARRAY['frontend/src/views/MyPageView.vue', 'frontend/src/services/userService.js']::text[], 2),
  ('ba899a68-09fb-4073-9e83-3a8963d74caa', '884bd125-4f31-406b-8935-6528ddeded90', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '백엔드 `logout.php`는 POST가 아닌 요청에 대해 어떻게 응답합니까?', '[{"id":"A","text":"405 상태와 ''POST 요청만 허용됩니다.'' 메시지를 반환한다"},{"id":"B","text":"204 상태만 반환하고 종료한다"},{"id":"C","text":"세션을 삭제한 뒤 success true를 반환한다"},{"id":"D","text":"로그인 페이지 HTML을 반환한다"}]'::jsonb, 'A', 'OPTIONS는 204로 처리하지만, POST가 아닌 일반 요청은 405와 메시지를 반환합니다. 세션 제거는 POST 요청 흐름에서 수행됩니다.', ARRAY['backend/api/auth/logout.php']::text[], 0),
  ('2ce7fad8-bdf5-4a09-83e4-391403637caf', '884bd125-4f31-406b-8935-6528ddeded90', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`logoutUser()`는 실제 API 모드에서 어떤 요청을 보냅니까?', '[{"id":"A","text":"`/api/auth/logout.php`에 POST 요청을 보낸다"},{"id":"B","text":"`/api/auth/me.php`에 GET 요청을 보낸다"},{"id":"C","text":"`/api/auth/logout.php`에 DELETE 요청을 보낸다"},{"id":"D","text":"API 요청 없이 localStorage만 삭제한다"}]'::jsonb, 'A', 'mock API가 아니면 `API_BASE_URL` 기준 `/api/auth/logout.php`로 POST 요청을 보냅니다. 응답이 실패하면 파싱된 에러 메시지로 예외를 던집니다.', ARRAY['frontend/src/services/authService.js']::text[], 1),
  ('aeac109c-0dd2-4005-91b3-5ca272d575e5', '884bd125-4f31-406b-8935-6528ddeded90', 'MULTIPLE_CHOICE', 'SIDE_EFFECT', '마이페이지의 `logout` 함수가 서버 로그아웃 실패에도 보장하는 동작은 무엇입니까?', '[{"id":"A","text":"`finally`에서 로컬 인증 정보를 정리하고 `/login`으로 이동한다"},{"id":"B","text":"오류가 나면 아무 상태도 바꾸지 않고 현재 페이지에 남는다"},{"id":"C","text":"실패한 요청을 무한 재시도한다"},{"id":"D","text":"서버 로그아웃 실패 시 `/splash`로 이동한다"}]'::jsonb, 'A', '`logoutUser()` 실패는 catch에서 무시되고, finally에서 `clearAuthAndGoLogin()`이 항상 실행됩니다. 이 함수는 여러 localStorage 키와 sessionStorage를 정리한 뒤 `/login`으로 이동합니다.', ARRAY['frontend/src/views/MyPageView.vue']::text[], 2),
  ('ade483c7-296a-4e3d-a5f4-73902b3fd84c', '3791a4e7-deb7-4d39-8dfd-ca78fde76aa0', 'MULTIPLE_CHOICE', 'API_CONTRACT', '변경된 `mapCard(item)`이 카드 색상과 제목을 읽는 필드 조합은 무엇입니까?', '[{"id":"A","text":"`color_hex`와 `color_name`"},{"id":"B","text":"`colorHex`와 `colorName`"},{"id":"C","text":"`pantoneCode`와 `trackCount`"},{"id":"D","text":"`songs`와 `tracks`"}]'::jsonb, 'A', '새 매핑은 API 응답의 snake_case 필드인 `color_hex`, `color_name`을 직접 사용합니다. 이전처럼 camelCase 후보들을 여러 개 확인하지 않습니다.', ARRAY['frontend/src/views/CategoryDetailView.vue']::text[], 0),
  ('240c56d6-f653-44c9-96b8-6a2a7f5150e9', '3791a4e7-deb7-4d39-8dfd-ca78fde76aa0', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`mapPreviewSongs(songs)`가 입력값을 카드의 미리보기 곡 목록으로 바꾸는 방식은 무엇입니까?', '[{"id":"A","text":"배열이 아니면 빈 배열을 반환하고, artist/title을 조합한 문자열을 최대 3개 반환한다"},{"id":"B","text":"문자열과 객체를 모두 받아 원본 값을 그대로 반환한다"},{"id":"C","text":"항상 `tracks` 필드를 읽고 정렬 후 10개를 반환한다"},{"id":"D","text":"곡 제목이 없으면 playlist id를 대신 반환한다"}]'::jsonb, 'A', '입력이 배열이 아니면 `[]`를 반환하고, 각 항목의 artist/title을 문자열로 만든 뒤 빈 값을 제거합니다. 마지막에 최대 3개로 제한합니다.', ARRAY['frontend/src/views/CategoryDetailView.vue']::text[], 1),
  ('306d3370-bc0b-4c0f-98f8-026cf87f6c74', '3791a4e7-deb7-4d39-8dfd-ca78fde76aa0', 'MULTIPLE_CHOICE', 'STRUCTURAL_CHANGE', '이번 변경에서 제거된 정규화 흐름의 성격으로 가장 알맞은 것은 무엇입니까?', '[{"id":"A","text":"여러 후보 필드명과 문자열/객체 입력을 폭넓게 받아들이던 fallback 매핑"},{"id":"B","text":"API 호출 자체를 제거하고 정적 더미 데이터만 쓰는 흐름"},{"id":"C","text":"카테고리 상세 페이지의 라우팅 기능 전체"},{"id":"D","text":"숫자 변환 유틸인 `toNumber` 함수"}]'::jsonb, 'A', '`normalizeSong`, `normalizePreviewSongs`, 여러 fallback 필드를 보던 `normalizeCard`가 제거되었습니다. 대신 API 응답 계약에 맞춘 `mapPreviewSongs`와 `mapCard`로 단순화되었습니다.', ARRAY['frontend/src/views/CategoryDetailView.vue']::text[], 2),
  ('fc2466c6-0a94-448d-81e4-591e3455e0d2', '39312fae-6062-4bca-b251-8bd2a57ee867', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`socialLogin`은 provider와 providerId를 정규화한 뒤 기존 사용자를 어떤 순서로 찾습니까?', '[{"id":"A","text":"정규화된 이메일로 먼저 찾고, 없으면 provider/providerId 조합으로 찾는다"},{"id":"B","text":"provider/providerId 조합으로만 찾고 이메일은 저장할 때만 사용한다"},{"id":"C","text":"accessToken을 복호화해서 사용자 id를 찾고, 실패하면 새 계정을 만든다"},{"id":"D","text":"항상 새 사용자를 만든 뒤 중복 이메일이면 삭제한다"}]'::jsonb, 'A', '`socialLogin`은 이메일이 있으면 `findOne({ email: normalizedEmail })`을 먼저 시도합니다. 그 다음 provider/providerId 기반의 `findUserBySocialIdentity`로 연결된 계정을 찾습니다.', ARRAY['backend/src/services/authService.js']::text[], 0),
  ('c3e5c923-a458-4a5e-bedd-d94036e351da', '39312fae-6062-4bca-b251-8bd2a57ee867', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '`applySocialProvider`가 이미 같은 provider/providerId 항목을 가진 사용자를 받으면 어떤 상태를 갱신합니까?', '[{"id":"A","text":"기존 social provider 항목의 `lastLoginAt`과, 값이 있으면 `profileImage`를 갱신한다"},{"id":"B","text":"기존 provider 항목을 지우고 사용자의 이메일을 빈 문자열로 바꾼다"},{"id":"C","text":"항상 `socialProviders` 배열에 중복 항목을 하나 더 추가한다"},{"id":"D","text":"사용자의 비밀번호 해시를 providerId로 교체한다"}]'::jsonb, 'A', '이미 연결된 provider가 있으면 새 항목을 추가하지 않고 로그인 시각을 갱신합니다. 프로필 이미지가 전달된 경우 해당 값도 함께 갱신합니다.', ARRAY['backend/src/services/authService.js', 'backend/src/models/User.js']::text[], 1),
  ('3afe8116-a259-4ba1-887f-a0c0f9954782', '39312fae-6062-4bca-b251-8bd2a57ee867', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '소셜 OAuth 콜백 처리에서 MongoDB 중복 키 오류(`code === 11000`)가 발생하면 컨트롤러는 어떤 redirect 결과를 만듭니까?', '[{"id":"A","text":"`social_login_failed` 오류 코드와 provider 값을 포함해 실패 페이지로 보낸다"},{"id":"B","text":"중복 키를 무시하고 accessToken을 쿼리스트링에 담아 성공 페이지로 보낸다"},{"id":"C","text":"사용자를 즉시 로그아웃시키고 홈 화면으로 보낸다"},{"id":"D","text":"provider 값을 제거하고 항상 `unknown_error`로 처리한다"}]'::jsonb, 'A', '컨트롤러는 중복 키 오류를 `social_login_failed`로 분기해 실패 redirect를 만듭니다. 성공 redirect에는 accessToken 대신 provider 정보가 포함됩니다.', ARRAY['backend/src/controllers/authController.js']::text[], 2),
  ('94d8c22b-a159-4bf1-983f-4ade841da399', '38d0b8d7-a493-4e97-84e0-48a9dffc365c', 'MULTIPLE_CHOICE', 'API_CONTRACT', '카카오 로그인 URL 생성 시 이번 변경으로 추가된 OAuth scope는 무엇입니까?', '[{"id":"A","text":"`account_email`"},{"id":"B","text":"`friends.read`"},{"id":"C","text":"`repo`"},{"id":"D","text":"`openid profile offline_access`"}]'::jsonb, 'A', '카카오 OAuth 설정에 이메일 제공 동의를 요청하기 위한 `account_email` scope가 추가되었습니다. 이후 백엔드 검증도 이메일 존재 여부를 전제로 동작합니다.', ARRAY['backend/src/services/socialOAuthService.js']::text[], 0),
  ('f0aed76d-938b-4e55-9eba-ee100037812c', '38d0b8d7-a493-4e97-84e0-48a9dffc365c', 'MULTIPLE_CHOICE', 'ERROR_HANDLING', '`assertRequiredProviderData`는 어떤 경우 `Kakao email consent is required` 오류를 던집니까?', '[{"id":"A","text":"provider가 kakao이고 매핑된 사용자 정보에 email이 없을 때"},{"id":"B","text":"provider가 google이고 nickname이 비어 있을 때"},{"id":"C","text":"OAuth code 값이 존재할 때"},{"id":"D","text":"사용자가 이미 로그인된 상태일 때"}]'::jsonb, 'A', '검증 함수는 카카오 provider에 한해 이메일 누락을 필수 데이터 오류로 처리합니다. 이 오류는 400 상태의 `ApiError`로 만들어집니다.', ARRAY['backend/src/services/socialOAuthService.js']::text[], 1),
  ('6fd5faa0-179e-4ee7-82a1-5a5721805e10', '38d0b8d7-a493-4e97-84e0-48a9dffc365c', 'MULTIPLE_CHOICE', 'DATA_FLOW', '`handleSocialCallback`에서 provider profile을 가져온 뒤 로그인 처리로 넘어가기 전 추가된 단계는 무엇입니까?', '[{"id":"A","text":"provider 사용자 정보를 매핑한 뒤 필수 provider 데이터를 검증한다"},{"id":"B","text":"프론트엔드 라우터를 직접 호출해 로그인 페이지를 새로고침한다"},{"id":"C","text":"모든 provider의 이메일을 임의 문자열로 대체한다"},{"id":"D","text":"DB에 저장하지 않고 OAuth 응답을 그대로 클라이언트에 반환한다"}]'::jsonb, 'A', '프로필 응답은 `mapProviderProfile`을 거친 뒤 `assertRequiredProviderData`로 검증됩니다. 검증을 통과한 providerUser만 `socialLogin`으로 전달됩니다.', ARRAY['backend/src/services/socialOAuthService.js']::text[], 2),
  ('d40d1337-3e27-41d7-a93b-6283acc4629b', 'eecef31b-eedc-4824-a59d-5c592a70f42b', 'MULTIPLE_CHOICE', 'STATE_CHANGE', '`confirmOrderItem`이 특정 상품을 확정한 뒤 주문 전체 상태를 `confirmed`로 바꾸는 조건은 무엇입니까?', '[{"id":"A","text":"주문 안의 모든 상품 status가 `confirmed`일 때"},{"id":"B","text":"확정 요청을 보낸 상품의 가격이 0보다 클 때"},{"id":"C","text":"주문 생성일이 오늘이면 항상 `confirmed`로 바꿀 때"},{"id":"D","text":"상품 하나라도 `confirmed`가 되면 즉시 주문 전체를 확정할 때"}]'::jsonb, 'A', '개별 상품을 확정한 뒤 `every`로 모든 item의 상태가 `confirmed`인지 확인합니다. 하나라도 남아 있으면 주문 상태는 `placed`로 유지됩니다.', ARRAY['backend/src/controllers/orderController.js', 'backend/src/models/Order.js']::text[], 0),
  ('51ef1036-3b65-4440-95ac-b9abe20379eb', 'eecef31b-eedc-4824-a59d-5c592a70f42b', 'MULTIPLE_CHOICE', 'API_CONTRACT', '상품 단위 구매 확정을 위해 추가된 라우트의 형태는 무엇입니까?', '[{"id":"A","text":"`PATCH /:orderId/items/:itemIndex/confirm`"},{"id":"B","text":"`POST /items/:itemIndex/orders/:orderId`"},{"id":"C","text":"`GET /:orderId/confirm?all=true`"},{"id":"D","text":"`DELETE /:orderId/items/:itemIndex`"}]'::jsonb, 'A', '새 라우트는 orderId와 itemIndex를 path parameter로 받아 `confirmOrderItem`에 연결됩니다. 기존 주문 전체 확정 라우트와 별도로 상품 단위 상태 변경을 담당합니다.', ARRAY['backend/src/routes/orderRoutes.js', 'backend/src/controllers/orderController.js']::text[], 1),
  ('bb623985-5213-4270-930c-6dd01e933ce8', 'eecef31b-eedc-4824-a59d-5c592a70f42b', 'MULTIPLE_CHOICE', 'DATA_FLOW', '주문 내역 화면에서 개별 상품 확정 요청을 보낼 때 사용하는 식별자 조합은 무엇입니까?', '[{"id":"A","text":"orderId와 itemIndex"},{"id":"B","text":"userId와 productName"},{"id":"C","text":"paymentKey와 totalAmount"},{"id":"D","text":"deliveryAddress와 phoneNumber"}]'::jsonb, 'A', '프론트엔드는 주문 항목을 펼칠 때 `itemIndex`를 보존하고, 확정 시 `/orders/${orderId}/items/${itemIndex}/confirm`로 요청합니다. 진행 상태도 orderId와 itemIndex를 조합한 키로 관리합니다.', ARRAY['frontend/src/pages/OrderHistory/OrderHistory.jsx']::text[], 2)
on conflict (id) do update set
  question = excluded.question,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  related_files = excluded.related_files,
  order_index = excluded.order_index;

-- @@CURATED_SEED_END
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
