-- Tape Deck payment configuration and reviewer tip methods.
-- Run in Supabase SQL Editor after reviewing the schema.
-- This migration stores settings and handles only; it does NOT process payments.
create table if not exists public.tapedeck_payment_settings (
  id boolean primary key default true check (id = true),
  queue_minimum_cents integer not null default 300 check (queue_minimum_cents >= 300),
  currency text not null default 'USD' check (currency = 'USD'),
  checkout_provider text not null default 'paypal' check (checkout_provider in ('paypal')),
  beta_random_pool_free boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.tapedeck_payment_settings (id, queue_minimum_cents, currency, checkout_provider, beta_random_pool_free)
values (true, 300, 'USD', 'paypal', true)
on conflict (id) do update set
  queue_minimum_cents = 300,
  currency = 'USD',
  checkout_provider = 'paypal',
  beta_random_pool_free = true,
  updated_at = now();

alter table public.tapedeck_payment_settings enable row level security;
drop policy if exists "Payment settings readable by everyone" on public.tapedeck_payment_settings;
create policy "Payment settings readable by everyone"
  on public.tapedeck_payment_settings for select using (true);
grant select on public.tapedeck_payment_settings to anon, authenticated;

create table if not exists public.reviewer_tip_methods (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('paypal', 'venmo', 'cash_app', 'chime')),
  handle text not null check (length(trim(handle)) between 1 and 120),
  display_label text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_id, method)
);

alter table public.reviewer_tip_methods enable row level security;
drop policy if exists "Reviewers manage their own tip methods" on public.reviewer_tip_methods;
create policy "Reviewers manage their own tip methods"
  on public.reviewer_tip_methods for all to authenticated
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);
drop policy if exists "Enabled reviewer tip methods are publicly visible" on public.reviewer_tip_methods;
create policy "Enabled reviewer tip methods are publicly visible"
  on public.reviewer_tip_methods for select
  using (is_enabled = true);
grant select on public.reviewer_tip_methods to anon, authenticated;
grant insert, update, delete on public.reviewer_tip_methods to authenticated;

notify pgrst, 'reload schema';
