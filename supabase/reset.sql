-- Supabase Dashboard → SQL Editor에서 schema.sql 재적용 전에 실행하세요.
-- public 스키마의 Proov 테이블을 모두 삭제합니다 (RLS 정책 포함).
-- auth.users / auth.identities 는 여기서 지우지 않습니다. 개발 시드 계정 정리는 아래 또는 schema.sql @@DEV_SEED 가 담당합니다.

drop table if exists public.submission_answers cascade;
drop table if exists public.submissions cascade;
drop table if exists public.questions cascade;
drop table if exists public.problem_sets cascade;
drop table if exists public.profiles cascade;

-- 개발 시드 이메일(앱 회원가입으로 생긴 계정 포함) 정리
delete from auth.identities
where user_id in (select id from auth.users where email = 'testuser@naver.com');

delete from auth.users where email = 'testuser@naver.com';
