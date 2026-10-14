alter table public.master_data_import_runs
  drop constraint if exists master_data_import_runs_domain_check;

alter table public.master_data_import_runs
  add constraint master_data_import_runs_domain_check
  check (domain in (
    'career', 'major', 'university', 'university_major',
    'career_major_mapping', 'admission', 'target_requirement'
  ));
