-- Production master-data integrity gate.
-- This migration is intentionally fail-closed: unverified catalog records remain
-- available to privileged curators but cannot enter student-facing recommendations.

alter table public.university_majors
  add column if not exists is_production_eligible boolean not null default false;

alter table public.career_major_mappings
  add column if not exists is_production_eligible boolean not null default false;

create table if not exists public.master_data_import_runs (
  id uuid primary key default gen_random_uuid(),
  domain text not null check (domain in ('career', 'major', 'university', 'university_major', 'career_major_mapping', 'admission')),
  source_name text not null check (nullif(btrim(source_name), '') is not null),
  source_url text not null check (nullif(btrim(source_url), '') is not null),
  source_version text,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'rejected')),
  input_records integer not null default 0 check (input_records >= 0),
  accepted_records integer not null default 0 check (accepted_records >= 0),
  rejected_records integer not null default 0 check (rejected_records >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  check (accepted_records + rejected_records <= input_records),
  check ((status = 'running' and completed_at is null) or (status <> 'running' and completed_at is not null))
);

alter table public.master_data_import_runs enable row level security;
revoke all on table public.master_data_import_runs from anon, authenticated;
create policy "Admins can read master-data import runs"
  on public.master_data_import_runs for select to authenticated
  using (private.is_admin());

create or replace function public.revoke_master_data_eligibility_on_material_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.is_production_eligible
     and (to_jsonb(new) - array['id', 'created_at', 'updated_at', 'last_verified_at', 'verified_by', 'is_production_eligible'])
       is distinct from
         (to_jsonb(old) - array['id', 'created_at', 'updated_at', 'last_verified_at', 'verified_by', 'is_production_eligible']) then
    new.is_production_eligible := false;
  end if;

  return new;
end;
$$;

drop trigger if exists master_data_careers_eligibility_guard on public.careers;
create trigger master_data_careers_eligibility_guard
  before update on public.careers
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_majors_eligibility_guard on public.majors;
create trigger master_data_majors_eligibility_guard
  before update on public.majors
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_universities_eligibility_guard on public.universities;
create trigger master_data_universities_eligibility_guard
  before update on public.universities
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_university_majors_eligibility_guard on public.university_majors;
create trigger master_data_university_majors_eligibility_guard
  before update on public.university_majors
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_career_major_mappings_eligibility_guard on public.career_major_mappings;
create trigger master_data_career_major_mappings_eligibility_guard
  before update on public.career_major_mappings
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_target_requirements_eligibility_guard on public.target_requirements;
create trigger master_data_target_requirements_eligibility_guard
  before update on public.target_requirements
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

drop trigger if exists master_data_admission_data_eligibility_guard on public.admission_data;
create trigger master_data_admission_data_eligibility_guard
  before update on public.admission_data
  for each row execute function public.revoke_master_data_eligibility_on_material_change();

alter table public.careers drop constraint if exists careers_production_eligibility_requires_provenance;
alter table public.careers add constraint careers_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      status in ('verified', 'published')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.majors drop constraint if exists majors_production_eligibility_requires_provenance;
alter table public.majors add constraint majors_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      status = 'published'
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.universities drop constraint if exists universities_production_eligibility_requires_provenance;
alter table public.universities add constraint universities_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      status = 'published'
      and verification_status in ('VERIFIED', 'CURATED')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.university_majors drop constraint if exists university_majors_production_eligibility_requires_provenance;
alter table public.university_majors add constraint university_majors_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      major_id is not null
      and status = 'published'
      and verification_status in ('VERIFIED', 'CURATED')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.career_major_mappings drop constraint if exists career_major_mappings_production_eligibility_requires_provenance;
alter table public.career_major_mappings add constraint career_major_mappings_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      status in ('verified', 'published')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.target_requirements drop constraint if exists target_requirements_production_eligibility_requires_provenance;
alter table public.target_requirements add constraint target_requirements_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      status in ('verified', 'published')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

alter table public.admission_data drop constraint if exists admission_data_production_eligibility_requires_provenance;
alter table public.admission_data add constraint admission_data_production_eligibility_requires_provenance
  check (
    not is_production_eligible
    or (
      data_status in ('verified', 'published')
      and nullif(btrim(source), '') is not null
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );

create index if not exists careers_production_eligible_idx
  on public.careers (career_domain_code, code)
  where is_production_eligible and status in ('verified', 'published');
create index if not exists majors_production_eligible_idx
  on public.majors (field, code)
  where is_production_eligible and status = 'published';
create index if not exists universities_production_eligible_idx
  on public.universities (location_region, slug)
  where is_production_eligible and status = 'published';
create index if not exists university_majors_production_eligible_idx
  on public.university_majors (major_id, university_id)
  where is_production_eligible and status = 'published';
create index if not exists career_major_mappings_production_eligible_idx
  on public.career_major_mappings (career_id, major_id)
  where is_production_eligible and status in ('verified', 'published');
create index if not exists admission_data_production_eligible_idx
  on public.admission_data (university_major_id, academic_year desc)
  where is_production_eligible and data_status in ('verified', 'published');

drop policy if exists "Public can view published careers" on public.careers;
create policy "Public can view production-eligible careers"
  on public.careers for select
  using ((status = 'published' and is_production_eligible) or private.is_admin());

drop policy if exists "Public read majors" on public.majors;
create policy "Public can view production-eligible majors"
  on public.majors for select
  using ((status = 'published' and is_production_eligible) or private.is_admin());

drop policy if exists "Public read universities" on public.universities;
create policy "Public can view production-eligible universities"
  on public.universities for select
  using ((status = 'published' and is_production_eligible) or private.is_admin());

drop policy if exists "Public read university_majors" on public.university_majors;
create policy "Public can view production-eligible university majors"
  on public.university_majors for select
  using ((status = 'published' and is_production_eligible) or private.is_admin());

drop policy if exists "Public read career_major_mappings" on public.career_major_mappings;
create policy "Public can view production-eligible career-major mappings"
  on public.career_major_mappings for select
  using ((status = 'published' and is_production_eligible) or private.is_admin());

drop policy if exists "Public read admission_data" on public.admission_data;
create policy "Public can view production-eligible admission data"
  on public.admission_data for select
  using ((data_status = 'published' and is_production_eligible) or private.is_admin());

update public.university_majors as program
set is_production_eligible = true
from public.universities as university, public.majors as major
where program.university_id = university.id
  and program.major_id = major.id
  and university.slug = 'rmit-university-vietnam'
  and major.slug = 'cu-nhan-kinh-doanh-rmit'
  and program.status = 'published'
  and program.verification_status = 'VERIFIED'
  and program.source_url = 'https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-business'
  and program.last_verified_at is not null;
