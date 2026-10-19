-- Tape Deck artist profiles
create table if not exists public.artist_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  soundcloud_url text not null default '',
  spotify_url text not null default '',
  youtube_url text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.artist_profiles enable row level security;

drop policy if exists "Artist profiles are public" on public.artist_profiles;
create policy "Artist profiles are public"
  on public.artist_profiles for select
  using (true);

drop policy if exists "Artists can create their own profile" on public.artist_profiles;
create policy "Artists can create their own profile"
  on public.artist_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Artists can update their own profile" on public.artist_profiles;
create policy "Artists can update their own profile"
  on public.artist_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.artist_profiles to authenticated;
grant select on public.artist_profiles to anon;
