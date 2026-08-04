-- Local-only until CORE-1 release: public image buckets with ownership-safe paths.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('organization-media', 'organization-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('content-media', 'content-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_owner_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_owner_update" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_owner_delete" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "organization_media_owner_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'organization-media' and exists (select 1 from public.organizations where id::text = (storage.foldername(name))[1] and (owner_id = (select auth.uid()) or private.is_admin())));
create policy "organization_media_owner_update" on storage.objects for update to authenticated
using (bucket_id = 'organization-media' and exists (select 1 from public.organizations where id::text = (storage.foldername(name))[1] and (owner_id = (select auth.uid()) or private.is_admin())))
with check (bucket_id = 'organization-media' and exists (select 1 from public.organizations where id::text = (storage.foldername(name))[1] and (owner_id = (select auth.uid()) or private.is_admin())));
create policy "organization_media_owner_delete" on storage.objects for delete to authenticated
using (bucket_id = 'organization-media' and exists (select 1 from public.organizations where id::text = (storage.foldername(name))[1] and (owner_id = (select auth.uid()) or private.is_admin())));

create policy "content_media_manager_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'content-media' and private.is_content_manager());
create policy "content_media_manager_update" on storage.objects for update to authenticated
using (bucket_id = 'content-media' and private.is_content_manager())
with check (bucket_id = 'content-media' and private.is_content_manager());
create policy "content_media_manager_delete" on storage.objects for delete to authenticated
using (bucket_id = 'content-media' and private.is_content_manager());
