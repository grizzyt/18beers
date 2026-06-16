-- Run this in Supabase SQL Editor to enable photos

-- 1. Add columns (safe if already exist)
alter table public.posts add column if not exists photo_url text;
alter table public.profiles add column if not exists avatar_url text;

-- 2. Create storage buckets
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3. Storage policies (drop first to avoid conflicts)
drop policy if exists "Public read post-photos" on storage.objects;
drop policy if exists "Auth upload post-photos" on storage.objects;
drop policy if exists "Auth delete post-photos" on storage.objects;
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Auth upload avatars" on storage.objects;
drop policy if exists "Auth update avatars" on storage.objects;
drop policy if exists "Auth delete avatars" on storage.objects;
drop policy if exists "Anyone can view post photos" on storage.objects;
drop policy if exists "Logged in users can upload post photos" on storage.objects;
drop policy if exists "Users can delete own post photos" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

create policy "Public read post-photos" on storage.objects for select using (bucket_id = 'post-photos');
create policy "Auth upload post-photos" on storage.objects for insert with check (bucket_id = 'post-photos' and auth.role() = 'authenticated');
create policy "Auth delete post-photos" on storage.objects for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Auth upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Auth update avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Auth delete avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
