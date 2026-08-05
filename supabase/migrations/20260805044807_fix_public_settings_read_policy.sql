drop policy if exists "app_settings_public_read" on public.app_settings;

create policy "app_settings_public_read" on public.app_settings for select to anon, authenticated
using (is_public);
