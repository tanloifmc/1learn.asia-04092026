drop policy if exists "organizations_public_or_owner_read" on public.organizations;

create policy "organizations_public_read_approved" on public.organizations for select to anon, authenticated
using (status = 'approved');

create policy "organizations_owner_read" on public.organizations for select to authenticated
using (owner_id = (select auth.uid()));
