-- P0: replacement of an active roadmap is all-or-nothing.
create or replace function public.replace_student_roadmap(
  p_student_id uuid,
  p_requirement_target_type text,
  p_requirement_target_id uuid,
  p_target jsonb,
  p_metadata jsonb,
  p_milestones jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_roadmap_id uuid;
  v_roadmap_version integer;
  v_milestone jsonb;
  v_task jsonb;
  v_milestone_id uuid;
  v_requirement_id uuid;
begin
  if p_student_id is null
     or p_requirement_target_type not in ('career', 'university_major')
     or p_requirement_target_id is null
     or jsonb_typeof(p_target) <> 'object'
     or jsonb_typeof(p_metadata) <> 'object'
     or jsonb_typeof(p_milestones) <> 'array'
     or jsonb_array_length(p_milestones) = 0 then
    raise exception 'invalid_roadmap_request' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.target_requirements
     where target_type = p_requirement_target_type
       and target_id = p_requirement_target_id
       and status in ('verified', 'published')
       and is_production_eligible = true
  ) then
    raise exception 'verified_requirements_unavailable' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_student_id::text));

  select coalesce(max(roadmap_version), 0) + 1
    into v_roadmap_version
    from public.roadmaps
   where student_id = p_student_id;

  update public.roadmaps
     set status = 'archived', archived_at = now()
   where student_id = p_student_id and status = 'active';

  insert into public.roadmaps (
    student_id, target_career_id, target_major_id, target_university_id,
    target_program_id, roadmap_version, generator_version, profile_version,
    academic_data_version, status
  ) values (
    p_student_id,
    nullif(p_target ->> 'targetCareerId', '')::uuid,
    nullif(p_target ->> 'targetMajorId', '')::uuid,
    nullif(p_target ->> 'targetUniversityId', '')::uuid,
    nullif(p_target ->> 'targetProgramId', '')::uuid,
    v_roadmap_version,
    p_metadata ->> 'generatorVersion',
    (p_metadata ->> 'profileVersion')::integer,
    (p_metadata ->> 'academicDataVersion')::timestamptz,
    'active'
  ) returning id into v_roadmap_id;

  for v_milestone in select value from jsonb_array_elements(p_milestones)
  loop
    v_requirement_id := nullif(v_milestone ->> 'sourceRequirementId', '')::uuid;
    if v_requirement_id is null or not exists (
      select 1 from public.target_requirements
       where id = v_requirement_id
         and target_type = p_requirement_target_type
         and target_id = p_requirement_target_id
         and status in ('verified', 'published')
         and is_production_eligible = true
    ) then
      raise exception 'unverified_milestone_requirement' using errcode = '23514';
    end if;

    insert into public.roadmap_milestones (
      roadmap_id, title, description, target_date, priority, source_requirement_id, order_index
    ) values (
      v_roadmap_id,
      nullif(v_milestone ->> 'title', ''),
      nullif(v_milestone ->> 'description', ''),
      (v_milestone ->> 'targetDate')::date,
      v_milestone ->> 'priority',
      v_requirement_id,
      (v_milestone ->> 'orderIndex')::integer
    ) returning id into v_milestone_id;

    if jsonb_typeof(v_milestone -> 'tasks') <> 'array' or jsonb_array_length(v_milestone -> 'tasks') = 0 then
      raise exception 'milestone_requires_tasks' using errcode = '23514';
    end if;

    for v_task in select value from jsonb_array_elements(v_milestone -> 'tasks')
    loop
      v_requirement_id := nullif(v_task ->> 'sourceRequirementId', '')::uuid;
      if v_requirement_id is null or not exists (
        select 1 from public.target_requirements
         where id = v_requirement_id
           and target_type = p_requirement_target_type
           and target_id = p_requirement_target_id
           and status in ('verified', 'published')
           and is_production_eligible = true
      ) then
        raise exception 'unverified_task_requirement' using errcode = '23514';
      end if;

      insert into public.roadmap_tasks (
        milestone_id, title, description, task_type, priority, due_date,
        estimated_effort, source_requirement_id, evidence_required, evidence_type
      ) values (
        v_milestone_id,
        nullif(v_task ->> 'title', ''),
        nullif(v_task ->> 'description', ''),
        v_task ->> 'taskType',
        v_task ->> 'priority',
        (v_task ->> 'dueDate')::date,
        nullif(v_task ->> 'estimatedEffort', ''),
        v_requirement_id,
        coalesce((v_task ->> 'evidenceRequired')::boolean, false),
        coalesce(nullif(v_task ->> 'evidenceType', ''), 'none')
      );
    end loop;
  end loop;

  return v_roadmap_id;
end;
$$;

revoke all on function public.replace_student_roadmap(uuid, text, uuid, jsonb, jsonb, jsonb) from public;
grant execute on function public.replace_student_roadmap(uuid, text, uuid, jsonb, jsonb, jsonb) to service_role;

drop policy if exists "Students can update their own task status" on public.roadmap_tasks;
create policy "Students can update their own task status"
on public.roadmap_tasks for update to authenticated
using (
  exists (
    select 1 from public.roadmap_milestones m
    join public.roadmaps r on m.roadmap_id = r.id
    where m.id = roadmap_tasks.milestone_id and r.student_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.roadmap_milestones m
    join public.roadmaps r on m.roadmap_id = r.id
    where m.id = roadmap_tasks.milestone_id and r.student_id = (select auth.uid())
  )
);
