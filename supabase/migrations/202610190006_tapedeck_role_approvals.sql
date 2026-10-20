-- Tape Deck role-based access control.
-- IMPORTANT: replace YOUR_LOGIN_EMAIL below with the owner's exact login email before running.
-- Run this migration in Supabase SQL Editor before enabling public reviewer access.

create table if not exists public.tapedeck_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'artist' check (role in ('artist','reviewer','admin')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tapedeck_reviewer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  message text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tapedeck_user_roles enable row level security;
alter table public.tapedeck_reviewer_requests enable row level security;

create or replace function public.tapedeck_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tapedeck_user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.tapedeck_has_reviewer_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tapedeck_user_roles
    where user_id = auth.uid() and role in ('reviewer','admin')
  );
$$;

revoke all on function public.tapedeck_is_admin() from public;
grant execute on function public.tapedeck_is_admin() to authenticated;
revoke all on function public.tapedeck_has_reviewer_access() from public;
grant execute on function public.tapedeck_has_reviewer_access() to authenticated;

drop policy if exists "Users can read own Tape Deck role" on public.tapedeck_user_roles;
create policy "Users can read own Tape Deck role"
  on public.tapedeck_user_roles for select to authenticated
  using (user_id = auth.uid() or public.tapedeck_is_admin());

drop policy if exists "Admins manage Tape Deck roles" on public.tapedeck_user_roles;
create policy "Admins manage Tape Deck roles"
  on public.tapedeck_user_roles for all to authenticated
  using (public.tapedeck_is_admin())
  with check (public.tapedeck_is_admin());

drop policy if exists "Users can read own reviewer request" on public.tapedeck_reviewer_requests;
create policy "Users can read own reviewer request"
  on public.tapedeck_reviewer_requests for select to authenticated
  using (user_id = auth.uid() or public.tapedeck_is_admin());

drop policy if exists "Users can request reviewer access" on public.tapedeck_reviewer_requests;
create policy "Users can request reviewer access"
  on public.tapedeck_reviewer_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_by is null and reviewed_at is null);

drop policy if exists "Admins manage reviewer requests" on public.tapedeck_reviewer_requests;
create policy "Admins manage reviewer requests"
  on public.tapedeck_reviewer_requests for all to authenticated
  using (public.tapedeck_is_admin())
  with check (public.tapedeck_is_admin());

grant select, insert, update, delete on public.tapedeck_user_roles to authenticated;
grant select, insert, update, delete on public.tapedeck_reviewer_requests to authenticated;

-- Bootstrap the owner as the first administrator. Replace the email before running.
insert into public.tapedeck_user_roles (user_id, role, approved_at)
select id, 'admin', now()
from auth.users
where lower(email) = lower('YOUR_LOGIN_EMAIL')
on conflict (user_id) do update set role = 'admin', approved_at = now(), updated_at = now();

-- Backfill existing users as artists unless an explicit role already exists.
insert into public.tapedeck_user_roles (user_id, role)
select id, 'artist' from auth.users
on conflict (user_id) do nothing;

-- Enforce reviewer approval at the database layer too. Hiding the UI is not security.
drop policy if exists "Signed-in users can publish reviews" on public.tape_reviews;
drop policy if exists "Approved reviewers can publish reviews" on public.tape_reviews;
create policy "Approved reviewers can publish reviews"
  on public.tape_reviews for insert
  to authenticated
  with check (
    public.tapedeck_has_reviewer_access()
    and length(trim(reviewer_name)) > 0
    and rating between 1 and 5
    and length(trim(body)) > 0
  );

notify pgrst, 'reload schema';
