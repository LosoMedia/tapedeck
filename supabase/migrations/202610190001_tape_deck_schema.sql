-- Tape Deck schema alignment migration
-- Run this once in Supabase SQL Editor for the Tape Deck project.
-- Existing rows are preserved; missing columns are added safely.

create extension if not exists pgcrypto;

alter table public.tapes
  add column if not exists artist_id uuid,
  add column if not exists artist text not null default '',
  add column if not exists classification text not null default 'organic',
  add column if not exists genre text not null default '',
  add column if not exists mood text not null default '',
  add column if not exists bpm integer not null default 120,
  add column if not exists musical_key text not null default '',
  add column if not exists duration text not null default '0:00',
  add column if not exists audio_url text,
  add column if not exists cover_url text not null default '',
  add column if not exists description text not null default '',
  add column if not exists skills_needed text[] not null default '{}',
  add column if not exists collaboration_status text not null default 'open',
  add column if not exists rating numeric not null default 0,
  add column if not exists plays text not null default '0',
  add column if not exists created_at timestamptz not null default now();

-- Backfill ownership for older rows when possible, then require ownership for new rows.
-- Rows that cannot be mapped are intentionally left alone so the migration doesn't destroy old content.
update public.tapes
set artist_id = auth.uid()
where artist_id is null and false;

create index if not exists tapes_created_at_idx on public.tapes (created_at desc);
create index if not exists tapes_artist_id_idx on public.tapes (artist_id);

alter table public.tapes enable row level security;

drop policy if exists "Tape Deck public can read tapes" on public.tapes;
create policy "Tape Deck public can read tapes"
  on public.tapes for select
  using (true);

drop policy if exists "Tape Deck members can publish own tapes" on public.tapes;
create policy "Tape Deck members can publish own tapes"
  on public.tapes for insert to authenticated
  with check (artist_id = auth.uid());

drop policy if exists "Tape Deck members can edit own tapes" on public.tapes;
create policy "Tape Deck members can edit own tapes"
  on public.tapes for update to authenticated
  using (artist_id = auth.uid())
  with check (artist_id = auth.uid());

drop policy if exists "Tape Deck members can delete own tapes" on public.tapes;
create policy "Tape Deck members can delete own tapes"
  on public.tapes for delete to authenticated
  using (artist_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tape-audio',
  'tape-audio',
  true,
  52428800,
  array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav','audio/aac','audio/ogg','audio/flac','audio/webm','application/octet-stream']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tape Deck public can listen to audio" on storage.objects;
create policy "Tape Deck public can listen to audio"
  on storage.objects for select
  using (bucket_id = 'tape-audio');

drop policy if exists "Tape Deck members can upload their audio" on storage.objects;
create policy "Tape Deck members can upload their audio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tape-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tape Deck members can update their audio" on storage.objects;
create policy "Tape Deck members can update their audio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tape-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tape-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tape Deck members can delete their audio" on storage.objects;
create policy "Tape Deck members can delete their audio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tape-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
