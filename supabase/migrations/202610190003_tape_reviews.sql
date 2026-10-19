-- Tape Deck community reviews
create table if not exists public.tape_reviews (
  id uuid primary key default gen_random_uuid(),
  tape_id uuid not null references public.tapes(id) on delete cascade,
  reviewer_name text not null,
  reviewer_role text not null default '',
  rating integer not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.tape_reviews enable row level security;

drop policy if exists "Reviews are publicly readable" on public.tape_reviews;
create policy "Reviews are publicly readable"
  on public.tape_reviews for select
  using (true);

drop policy if exists "Signed-in users can publish reviews" on public.tape_reviews;
create policy "Signed-in users can publish reviews"
  on public.tape_reviews for insert
  to authenticated
  with check (
    length(trim(reviewer_name)) > 0
    and rating between 1 and 5
    and length(trim(body)) > 0
  );

grant select on public.tape_reviews to anon, authenticated;
grant insert on public.tape_reviews to authenticated;

-- Refresh PostgREST's schema cache so the new table is visible to the app.
notify pgrst, 'reload schema';
