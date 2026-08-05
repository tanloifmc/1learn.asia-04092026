drop policy if exists "organization_media_owner_insert" on storage.objects;
drop policy if exists "organization_media_owner_update" on storage.objects;
drop policy if exists "organization_media_owner_delete" on storage.objects;

create policy "organization_media_owner_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'organization-media'
  and exists (
    select 1 from public.organizations
    where id::text = (storage.foldername(name))[1]
      and owner_id = (select auth.uid())
  )
);

create policy "organization_media_owner_update" on storage.objects for update to authenticated
using (
  bucket_id = 'organization-media'
  and exists (
    select 1 from public.organizations
    where id::text = (storage.foldername(name))[1]
      and owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'organization-media'
  and exists (
    select 1 from public.organizations
    where id::text = (storage.foldername(name))[1]
      and owner_id = (select auth.uid())
  )
);

create policy "organization_media_owner_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'organization-media'
  and exists (
    select 1 from public.organizations
    where id::text = (storage.foldername(name))[1]
      and owner_id = (select auth.uid())
  )
);

create policy "organization_media_admin_manage" on storage.objects for all to authenticated
using (bucket_id = 'organization-media' and private.is_admin())
with check (bucket_id = 'organization-media' and private.is_admin());
