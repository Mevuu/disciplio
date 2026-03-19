-- Timezone Migration
-- Run this in the Supabase SQL Editor

-- Add timezone column to profiles
alter table public.profiles
  add column if not exists timezone text default 'UTC';
