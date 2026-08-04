-- Public content must not evaluate private.is_content_manager(), because that
-- function is intentionally unavailable to anon callers.
drop policy if exists "content_posts_public_read_published" on public.content_posts;
create policy "content_posts_public_read_published" on public.content_posts for select to anon, authenticated
using (status = 'published');

drop policy if exists "content_pages_public_read_published" on public.content_pages;
create policy "content_pages_public_read_published" on public.content_pages for select to anon, authenticated
using (status = 'published');
