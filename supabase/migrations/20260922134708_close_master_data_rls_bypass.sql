-- Close legacy RLS policies that could bypass the master-data eligibility gate.

drop policy if exists "Public read careers" on public.careers;

drop policy if exists "Public can read verified requirements" on public.target_requirements;
create policy "Public can read production-eligible requirements"
  on public.target_requirements for select to anon, authenticated
  using (
    is_production_eligible
    and status in ('verified', 'published')
  );
