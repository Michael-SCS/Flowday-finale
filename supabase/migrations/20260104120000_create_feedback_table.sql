-- Creates a minimal feedback inbox for v1.
-- Users can insert feedback; only server/service role can read.

create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  user_mail text,
  message text not null check (char_length(message) between 1 and 4000)
);

alter table public.feedback enable row level security;

grant insert on table public.feedback to authenticated;

-- Allow authenticated users to insert their own feedback.
create policy "feedback_insert_own" on public.feedback
for insert to authenticated
with check (auth.uid() = user_id);
