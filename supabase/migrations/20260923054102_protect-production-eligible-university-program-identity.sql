-- Candidate records can be incomplete or duplicated while awaiting official
-- programme evidence. Student-facing programmes must instead have a concrete
-- programme type and a unique identity within their university/major pair.

alter table public.university_majors
  drop constraint if exists university_majors_eligible_program_type_required;

alter table public.university_majors
  add constraint university_majors_eligible_program_type_required
  check (
    not is_production_eligible
    or coalesce(nullif(btrim(program_type), ''), '') <> ''
  );

create unique index if not exists university_majors_production_eligible_identity_unique_idx
  on public.university_majors (
    university_id,
    major_id,
    (nullif(btrim(program_type), ''))
  )
  where is_production_eligible;
