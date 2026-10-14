-- Field-level evidence for master data. A source on a row is useful for
-- discovery, but it cannot prove every independently maintained field (for
-- example an occupational RIASEC profile and a university programme outcome).
-- This ledger is append-only for application roles and is checked whenever a
-- record is promoted to the student-facing catalog.

create table public.master_data_evidence (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'career', 'major', 'university', 'university_major',
    'career_major_mapping', 'admission'
  )),
  entity_id uuid not null,
  field_path text not null check (nullif(btrim(field_path), '') is not null),
  source_name text not null check (nullif(btrim(source_name), '') is not null),
  source_url text not null check (nullif(btrim(source_url), '') is not null),
  source_type text not null check (nullif(btrim(source_type), '') is not null),
  source_version text,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  claim text not null check (nullif(btrim(claim), '') is not null and length(claim) <= 2000),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'verified', 'superseded', 'rejected')),
  retrieved_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  import_run_id uuid references public.master_data_import_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (review_status = 'verified' and verified_at is not null)
    or (review_status <> 'verified')
  ),
  unique (entity_type, entity_id, field_path, source_sha256)
);

create index master_data_evidence_entity_idx
  on public.master_data_evidence (entity_type, entity_id, field_path)
  where review_status = 'verified';
create index master_data_evidence_import_run_idx
  on public.master_data_evidence (import_run_id)
  where import_run_id is not null;

create or replace function public.master_data_evidence_entity_exists()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  target_table regclass;
  entity_exists boolean;
begin
  target_table := case new.entity_type
    when 'career' then 'public.careers'::regclass
    when 'major' then 'public.majors'::regclass
    when 'university' then 'public.universities'::regclass
    when 'university_major' then 'public.university_majors'::regclass
    when 'career_major_mapping' then 'public.career_major_mappings'::regclass
    when 'admission' then 'public.admission_data'::regclass
  end;

  execute format('select exists (select 1 from %s where id = $1)', target_table)
    into entity_exists using new.entity_id;
  if not entity_exists then
    raise exception 'master_data_evidence entity % (%) does not exist', new.entity_type, new.entity_id;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger master_data_evidence_entity_guard
  before insert or update on public.master_data_evidence
  for each row execute function public.master_data_evidence_entity_exists();

create or replace function public.require_master_data_evidence_for_eligibility()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  required_paths text[];
  entity_kind text := tg_argv[0];
  evidence_count integer;
begin
  if not new.is_production_eligible then
    return new;
  end if;

  required_paths := case entity_kind
    when 'career' then array['identity', 'riasec_profile']
    when 'major' then array['identity']
    when 'university' then array['identity']
    when 'university_major' then array['programme']
    when 'career_major_mapping' then array['relationship']
    when 'admission' then array['admission']
  end;

  select count(distinct field_path)
    into evidence_count
  from public.master_data_evidence
  where entity_type = entity_kind
    and entity_id = new.id
    and review_status = 'verified'
    and field_path = any(required_paths);

  if evidence_count <> cardinality(required_paths) then
    raise exception 'cannot mark % % production eligible without verified evidence for %',
      entity_kind, new.id, required_paths;
  end if;

  return new;
end;
$$;

create trigger master_data_careers_evidence_guard
  before insert or update on public.careers
  for each row execute function public.require_master_data_evidence_for_eligibility('career');
create trigger master_data_majors_evidence_guard
  before insert or update on public.majors
  for each row execute function public.require_master_data_evidence_for_eligibility('major');
create trigger master_data_universities_evidence_guard
  before insert or update on public.universities
  for each row execute function public.require_master_data_evidence_for_eligibility('university');
create trigger master_data_university_majors_evidence_guard
  before insert or update on public.university_majors
  for each row execute function public.require_master_data_evidence_for_eligibility('university_major');
create trigger master_data_career_major_mappings_evidence_guard
  before insert or update on public.career_major_mappings
  for each row execute function public.require_master_data_evidence_for_eligibility('career_major_mapping');
create trigger master_data_admission_data_evidence_guard
  before insert or update on public.admission_data
  for each row execute function public.require_master_data_evidence_for_eligibility('admission');

alter table public.master_data_evidence enable row level security;
revoke all on table public.master_data_evidence from anon, authenticated;
create policy "Admins can read master-data evidence"
  on public.master_data_evidence for select to authenticated
  using (private.is_admin());
