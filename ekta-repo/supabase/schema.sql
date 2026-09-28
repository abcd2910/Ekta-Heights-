-- Ekta Heights Daily Work — database schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

create table if not exists public.work_items (
  id            text primary key,
  emp           text not null,        -- VAN / SID / RAS / BEL / RAJ / HAR
  emp_name      text not null,
  cat           text not null,        -- work category
  customer      text not null,        -- customer name or file reference
  expected      text,                 -- expected action
  actual        text,                 -- what actually happened
  status        text not null,        -- 'Completed' or 'Pending'
  reason        text,                 -- pending reason
  next_action   text,                 -- next action
  due           date,                 -- due date
  remarks       text,
  log_date      date not null,        -- the day it was first logged
  completed_on  date,                 -- null while open
  updated_at    timestamptz not null default now()
);

create index if not exists work_items_emp_idx        on public.work_items (emp);
create index if not exists work_items_status_idx     on public.work_items (status);
create index if not exists work_items_log_date_idx   on public.work_items (log_date);
create index if not exists work_items_updated_at_idx on public.work_items (updated_at desc);

-- Row Level Security -------------------------------------------------
-- The app uses the public "anon" key, so anyone who has the site URL can
-- read and write. That is acceptable for an internal tool behind a private
-- Vercel URL, but see the "Locking it down" section of README.md before
-- treating this as secure.

alter table public.work_items enable row level security;

drop policy if exists work_items_read  on public.work_items;
drop policy if exists work_items_write on public.work_items;
drop policy if exists work_items_edit  on public.work_items;

create policy work_items_read  on public.work_items for select using (true);
create policy work_items_write on public.work_items for insert with check (true);
create policy work_items_edit  on public.work_items for update using (true) with check (true);

-- Deliberately NO delete policy: nothing can be deleted from the app.
