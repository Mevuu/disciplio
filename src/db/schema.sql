-- Disciplio Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now(),
  streak_count integer default 0,
  last_checkin_date date,
  streak_freeze_count integer default 1,
  freeze_reset_month text,
  subscription_status text default 'free',
  partner_id uuid references public.profiles(id),
  habit_slots_unlocked integer default 3
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Habits
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  habit_text text not null,
  habit_emoji text not null,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;

create policy "Users can read own habits"
  on public.habits for select using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete using (auth.uid() = user_id);

-- Check-ins
create table if not exists public.checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  habits_completed uuid[] default '{}',
  fully_completed boolean default false,
  used_freeze boolean default false,
  unique(user_id, date)
);

alter table public.checkins enable row level security;

create policy "Users can read own checkins"
  on public.checkins for select using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on public.checkins for insert with check (auth.uid() = user_id);

create policy "Users can update own checkins"
  on public.checkins for update using (auth.uid() = user_id);

-- Partnerships
create table if not exists public.partnerships (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references auth.users on delete cascade not null,
  user2_id uuid references auth.users on delete cascade not null,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.partnerships enable row level security;

create policy "Users can read own partnerships"
  on public.partnerships for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can insert partnerships"
  on public.partnerships for insert
  with check (auth.uid() = user1_id);

create policy "Users can update own partnerships"
  on public.partnerships for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Friendships
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  friend_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.friendships enable row level security;

create policy "Users can read own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id);
