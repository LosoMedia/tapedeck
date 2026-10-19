-- Tape Deck review queue: dedicated line + free-during-beta random pool.
create extension if not exists pgcrypto;

create table if not exists public.tape_review_queue (
  id uuid primary key default gen_random_uuid(),
  tape_id uuid not null references public.tapes(id) on delete cascade,
  artist_id uuid not null references auth.users(id) on delete cascade,
  queue_type text not null check (queue_type in ('dedicated','random')),
  status text not null default 'waiting' check (status in ('waiting','reviewing','reviewed','cancelled')),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tape_review_queue_waiting_idx
  on public.tape_review_queue(queue_type, created_at)
  where status = 'waiting';
create index if not exists tape_review_queue_artist_idx
  on public.tape_review_queue(artist_id, created_at desc);
create unique index if not exists tape_review_queue_one_active_route
  on public.tape_review_queue(tape_id, queue_type)
  where status in ('waiting','reviewing');

alter table public.tape_review_queue enable row level security;
drop policy if exists "Queue entries are readable" on public.tape_review_queue;
create policy "Queue entries are readable" on public.tape_review_queue
  for select to authenticated using (true);
drop policy if exists "Artists can queue their own tapes" on public.tape_review_queue;
create policy "Artists can queue their own tapes" on public.tape_review_queue
  for insert to authenticated
  with check (
    artist_id = auth.uid()
    and exists (select 1 from public.tapes t where t.id = tape_id and t.artist_id = auth.uid())
  );
drop policy if exists "Artists can cancel their own waiting entries" on public.tape_review_queue;
create policy "Artists can cancel their own waiting entries" on public.tape_review_queue
  for update to authenticated
  using (artist_id = auth.uid() and status = 'waiting')
  with check (artist_id = auth.uid() and status = 'cancelled');

grant select, insert, update on public.tape_review_queue to authenticated;

-- Atomically claim one item so two reviewers cannot take the same entry.
create or replace function public.claim_next_tape_review(p_queue_type text default 'random')
returns setof public.tape_review_queue
language plpgsql
security definer
set search_path = public
as $$
declare claimed public.tape_review_queue;
begin
  if auth.uid() is null then
    raise exception 'Sign in to claim a review.';
  end if;
  if p_queue_type not in ('dedicated','random') then
    raise exception 'Unknown queue type.';
  end if;

  select * into claimed
  from public.tape_review_queue q
  where q.status = 'waiting' and q.queue_type = p_queue_type
  order by
    case when p_queue_type = 'random' then random() else null end,
    q.created_at asc
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update public.tape_review_queue
  set status = 'reviewing', claimed_by = auth.uid(), claimed_at = now(), updated_at = now()
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;
revoke all on function public.claim_next_tape_review(text) from public;
grant execute on function public.claim_next_tape_review(text) to authenticated;

create or replace function public.complete_tape_review_queue_item(p_tape_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to complete a review.'; end if;
  update public.tape_review_queue
  set status = 'reviewed', completed_at = now(), updated_at = now()
  where tape_id = p_tape_id and status = 'reviewing' and claimed_by = auth.uid();
end;
$$;
revoke all on function public.complete_tape_review_queue_item(uuid) from public;
grant execute on function public.complete_tape_review_queue_item(uuid) to authenticated;

-- Supabase Realtime: add table to publication when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tape_review_queue'
     ) then
    alter publication supabase_realtime add table public.tape_review_queue;
  end if;
end $$;

notify pgrst, 'reload schema';
