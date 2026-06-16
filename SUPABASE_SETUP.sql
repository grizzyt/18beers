-- Run this entire file in Supabase → SQL Editor → New Query

-- 1. Users profile table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Posts table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  beer text not null,
  rating integer check (rating between 1 and 5) not null,
  bar_name text not null,
  place_id text,
  city text,
  state text,
  note text,
  to_go boolean default false,
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc', now())
);

-- 3. Likes table (so users can like posts)
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  unique(post_id, user_id)
);

-- 4. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;

-- Profiles: users can read all, update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts: anyone can read, logged-in users can insert, own posts can be deleted
create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Logged in users can post" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Likes: anyone can read, logged-in users can like/unlike
create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Logged in users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- 5. Enable realtime on posts
alter publication supabase_realtime add table public.posts;

-- ── Run this block to add comments support ──────────────────────────────────

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  body text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Logged in users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Add comment_count column to posts for fast display
alter table public.posts add column if not exists comment_count integer default 0;

-- Auto-increment/decrement comment_count
create or replace function public.handle_comment_insert()
returns trigger as $$
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_comment_delete()
returns trigger as $$
begin
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_insert on public.comments;
create trigger on_comment_insert after insert on public.comments
  for each row execute procedure public.handle_comment_insert();

drop trigger if exists on_comment_delete on public.comments;
create trigger on_comment_delete after delete on public.comments
  for each row execute procedure public.handle_comment_delete();

-- Enable realtime on comments
alter publication supabase_realtime add table public.comments;

-- ── Run this block to fix like counts ───────────────────────────────────────

-- Safe increment/decrement functions so likes never go negative
create or replace function public.increment_likes(post_id uuid)
returns void as $$
  update public.posts set likes = likes + 1 where id = post_id;
$$ language sql security definer;

create or replace function public.decrement_likes(post_id uuid)
returns void as $$
  update public.posts set likes = greatest(likes - 1, 0) where id = post_id;
$$ language sql security definer;

-- ── Friends system ────────────────────────────────────────────────────────────

-- Friends / follow requests table
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users on delete cascade not null,
  addressee_id uuid references auth.users on delete cascade not null,
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamp with time zone default timezone('utc', now()),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;
create policy "Users can see their own friendships" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on public.friendships for insert with check (auth.uid() = requester_id);
create policy "Users can update requests sent to them" on public.friendships for update using (auth.uid() = addressee_id);
create policy "Users can delete their own friendships" on public.friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Post tags — who was tagged in a post
create table if not exists public.post_tags (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  unique(post_id, user_id)
);

alter table public.post_tags enable row level security;
create policy "Post tags viewable by everyone" on public.post_tags for select using (true);
create policy "Post author can tag friends" on public.post_tags for insert with check (auth.uid() in (select user_id from public.posts where id = post_id));
create policy "Post author can remove tags" on public.post_tags for delete using (auth.uid() in (select user_id from public.posts where id = post_id));

-- Make profiles searchable
create policy "Profiles searchable by logged in users" on public.profiles for select using (auth.uid() is not null);

-- Realtime for friendships
alter publication supabase_realtime add table public.friendships;

-- ── Photos / Storage setup ────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- Add photo_url to posts
alter table public.posts add column if not exists photo_url text;

-- Add avatar_url to profiles
alter table public.profiles add column if not exists avatar_url text;

-- Storage buckets are created via the Supabase dashboard or API
-- Go to Storage → New bucket:
--   1. Name: "post-photos"  | Public: ON
--   2. Name: "avatars"      | Public: ON

-- Storage RLS policies (run after creating buckets)
insert into storage.buckets (id, name, public) values ('post-photos', 'post-photos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "Anyone can view post photos" on storage.objects for select using (bucket_id = 'post-photos');
create policy "Logged in users can upload post photos" on storage.objects for insert with check (bucket_id = 'post-photos' and auth.uid() is not null);
create policy "Users can delete own post photos" on storage.objects for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own avatar" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── IMPORTANT: Run this to add missing columns if you skipped earlier ─────────
alter table public.posts add column if not exists photo_url text;
alter table public.profiles add column if not exists avatar_url text;

-- Drop and recreate storage policies cleanly (in case of conflicts)
drop policy if exists "Anyone can view post photos" on storage.objects;
drop policy if exists "Logged in users can upload post photos" on storage.objects;
drop policy if exists "Users can delete own post photos" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

-- Recreate buckets as public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

-- Simple open policies for public buckets
create policy "Public read post-photos" on storage.objects for select using (bucket_id = 'post-photos');
create policy "Auth upload post-photos" on storage.objects for insert with check (bucket_id = 'post-photos' and auth.role() = 'authenticated');
create policy "Auth delete post-photos" on storage.objects for delete using (bucket_id = 'post-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Auth upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Auth update avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Auth delete avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
