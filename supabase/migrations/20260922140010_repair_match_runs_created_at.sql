-- Align the live table with the documented and already-used match-run contract.
alter table public.match_runs
  add column if not exists created_at timestamptz not null default now();

create index if not exists match_runs_student_created_at_idx
  on public.match_runs (student_id, created_at desc);
