-- Run in the Supabase SQL editor for project setup.

create table if not exists public.rounds (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_courses (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists rounds_updated_at_idx on public.rounds (updated_at desc);
create index if not exists saved_courses_updated_at_idx on public.saved_courses (updated_at desc);

alter table public.rounds enable row level security;
alter table public.saved_courses enable row level security;

create policy "Allow anon read rounds"
  on public.rounds for select
  to anon
  using (true);

create policy "Allow anon insert rounds"
  on public.rounds for insert
  to anon
  with check (true);

create policy "Allow anon update rounds"
  on public.rounds for update
  to anon
  using (true)
  with check (true);

create policy "Allow anon delete rounds"
  on public.rounds for delete
  to anon
  using (true);

create policy "Allow anon read saved_courses"
  on public.saved_courses for select
  to anon
  using (true);

create policy "Allow anon insert saved_courses"
  on public.saved_courses for insert
  to anon
  with check (true);

create policy "Allow anon update saved_courses"
  on public.saved_courses for update
  to anon
  using (true)
  with check (true);

create policy "Allow anon delete saved_courses"
  on public.saved_courses for delete
  to anon
  using (true);
