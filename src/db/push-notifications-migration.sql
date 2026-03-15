-- Push Notifications Migration
-- Run this in the Supabase SQL Editor AFTER the initial schema

-- Push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  notifications_enabled boolean default true,
  unique(user_id)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can read own push subscription"
  on public.push_subscriptions for select using (auth.uid() = user_id);

create policy "Users can insert own push subscription"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update own push subscription"
  on public.push_subscriptions for update using (auth.uid() = user_id);

create policy "Users can delete own push subscription"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

-- Add last_nudge_sent to partnerships
alter table public.partnerships
  add column if not exists last_nudge_sent timestamptz;
