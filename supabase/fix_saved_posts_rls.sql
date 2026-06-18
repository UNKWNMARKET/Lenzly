-- Allow authenticated users to save ANY post (not just their own)
-- The user_id check ensures you can only manage your own saves, not others'

drop policy if exists "saved_posts_owner_read"   on public.saved_posts;
drop policy if exists "saved_posts_owner_insert"  on public.saved_posts;
drop policy if exists "saved_posts_owner_delete"  on public.saved_posts;
drop policy if exists "saved_posts_insert"        on public.saved_posts;
drop policy if exists "saved_posts_select"        on public.saved_posts;
drop policy if exists "saved_posts_delete"        on public.saved_posts;

-- Read your own saves
create policy "saved_posts_select"
on public.saved_posts for select to authenticated
using ( auth.uid() = user_id );

-- Save any post (post_id is not restricted, only user_id must match the saver)
create policy "saved_posts_insert"
on public.saved_posts for insert to authenticated
with check ( auth.uid() = user_id );

-- Delete your own saves
create policy "saved_posts_delete"
on public.saved_posts for delete to authenticated
using ( auth.uid() = user_id );
