-- Run in the Supabase SQL editor, then add your Auth user's UUID to site_editors.
create table if not exists public.site_editors (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.site_editors enable row level security;
grant select on public.site_editors to authenticated;
create policy "Editors can see their own membership" on public.site_editors for select to authenticated using (user_id = (select auth.uid()));
create table if not exists public.site_content (
 id text primary key check (id = 'main'),
 fields jsonb not null constraint site_content_fields_check check (jsonb_typeof(fields) = 'array' or (jsonb_typeof(fields) = 'object' and coalesce(fields->>'version', '') = '2')),
 updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
create policy "Public can read published content" on public.site_content for select to anon, authenticated using (true);
create policy "Editors can insert content" on public.site_content for insert to authenticated with check (exists (select 1 from public.site_editors where user_id = (select auth.uid())));
create policy "Editors can update content" on public.site_content for update to authenticated using (exists (select 1 from public.site_editors where user_id = (select auth.uid()))) with check (exists (select 1 from public.site_editors where user_id = (select auth.uid())));
-- insert into public.site_editors (user_id) values ('YOUR-AUTH-USER-UUID');
