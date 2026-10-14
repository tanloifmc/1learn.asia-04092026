-- A target can require one credential from an accepted set, e.g. IELTS OR
-- TOEFL OR PTE. Keeping each credential as an independent mandatory row would
-- create a false roadmap gap and incorrectly lower readiness.
alter table public.target_requirements
  add column if not exists satisfaction_group text;

alter table public.target_requirements
  drop constraint if exists target_requirements_satisfaction_group_not_blank;

alter table public.target_requirements
  add constraint target_requirements_satisfaction_group_not_blank
  check (satisfaction_group is null or btrim(satisfaction_group) <> '');

comment on column public.target_requirements.satisfaction_group is
  'Non-null rows with the same target and group are alternatives: satisfying any one row satisfies that group. Null means the row is independently required.';

create index if not exists target_requirements_target_satisfaction_group_idx
  on public.target_requirements (target_type, target_id, satisfaction_group)
  where satisfaction_group is not null;
