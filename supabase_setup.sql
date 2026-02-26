-- Run this in Supabase SQL editor
create table if not exists public.portfolio_items (
  id bigint generated always as identity primary key,
  type text not null check (type in ('web_apps', 'projects', 'python_packages')),
  title text not null,
  description text not null,
  url text,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

-- Public read access for portfolio rendering
create policy if not exists "public can read portfolio" on public.portfolio_items
for select
using (true);

-- Authenticated admin can insert rows
create policy if not exists "authenticated can insert portfolio" on public.portfolio_items
for insert
to authenticated
with check (true);
