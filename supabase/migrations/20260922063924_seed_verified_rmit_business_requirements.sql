-- Source reviewed 2026-09-22: RMIT Vietnam's official Bachelor of Business page.
-- This is genuine master data, not an E2E fixture. Re-verify before its source
-- becomes stale or the program's admissions criteria change.
do $$
declare
  v_university_id uuid;
  v_major_id uuid;
  v_program_id uuid;
  v_source_url constant text := 'https://www.rmit.edu.vn/study-at-rmit/undergraduate-programs/bachelor-business';
begin
  insert into public.universities (
    name, short_name, slug, location_city, location_region, type, scale, status,
    source, source_url, last_verified_at, is_production_eligible, verification_status,
    website, admissions_website
  ) values (
    'RMIT University Vietnam', 'RMIT Vietnam', 'rmit-university-vietnam',
    'Hồ Chí Minh', 'South', 'international', 'large', 'published',
    'RMIT Vietnam official Bachelor of Business page', v_source_url, now(), true, 'VERIFIED',
    'https://www.rmit.edu.vn', v_source_url
  ) on conflict (slug) do update set
    source = excluded.source,
    source_url = excluded.source_url,
    last_verified_at = excluded.last_verified_at,
    is_production_eligible = true,
    verification_status = 'VERIFIED',
    admissions_website = excluded.admissions_website;

  insert into public.majors (
    name, code, slug, field, status, source, source_url, last_verified_at, is_production_eligible, verified_by
  ) values (
    'Cử nhân Kinh doanh', 'RMIT-BBUS', 'cu-nhan-kinh-doanh-rmit', 'Business', 'published',
    'RMIT Vietnam official Bachelor of Business page', v_source_url, now(), true, null
  ) on conflict (slug) do update set
    source = excluded.source,
    source_url = excluded.source_url,
    last_verified_at = excluded.last_verified_at,
    is_production_eligible = true,
    verified_by = excluded.verified_by;

  select id into v_university_id from public.universities where slug = 'rmit-university-vietnam';
  select id into v_major_id from public.majors where slug = 'cu-nhan-kinh-doanh-rmit';

  select id into v_program_id
    from public.university_majors
   where university_id = v_university_id and major_id = v_major_id and program_name = 'Bachelor of Business'
   limit 1;

  if v_program_id is null then
    insert into public.university_majors (
      university_id, major_id, program_name, degree_level, campus, program_type,
      status, source, source_url, last_verified_at, verified_by, verification_status,
      original_major_code, original_major_name, mapping_status
    ) values (
      v_university_id, v_major_id, 'Bachelor of Business', 'undergraduate', 'RMIT Vietnam', 'full_time',
      'published', 'RMIT Vietnam official Bachelor of Business page', v_source_url, now(),
      null, 'VERIFIED', 'RMIT-BBUS', 'Bachelor of Business', 'VERIFIED'
    ) returning id into v_program_id;
  end if;

  insert into public.target_requirements (
    target_type, target_id, requirement_code, requirement_type, comparison_operator,
    requirement_value, unit, importance, status, source, source_url, last_verified_at,
    is_production_eligible
  ) values
    ('university_major', v_program_id, 'academic_gpa_grade12', 'academic', '>=', '7.0', 'score_10', 'high', 'published', v_source_url, v_source_url, now(), true),
    ('university_major', v_program_id, 'ielts_academic_overall', 'certification', '>=', '6.5', 'IELTS', 'critical', 'published', v_source_url, v_source_url, now(), true)
  on conflict do nothing;
end $$;
