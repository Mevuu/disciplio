-- Partnership System Migration
-- Run this in the Supabase SQL Editor AFTER the initial schema + push migration

-- 1. Add username to profiles
alter table public.profiles
  add column if not exists username text unique;

-- 2. Add partner_streak + last_partner_streak_date to partnerships
alter table public.partnerships
  add column if not exists partner_streak integer default 0;

alter table public.partnerships
  add column if not exists last_partner_streak_date date;

-- last_nudge_sent may already exist from push migration — safe to re-run
alter table public.partnerships
  add column if not exists last_nudge_sent timestamptz;

-- 3. Delete policy for partnerships (needed for removing partner)
create policy "Users can delete own partnerships"
  on public.partnerships for delete
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- 4. Partner invites table (for shareable links to non-users)
create table if not exists public.partner_invites (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users on delete cascade not null,
  invite_code text unique not null,
  created_at timestamptz default now(),
  status text default 'pending'
);

alter table public.partner_invites enable row level security;

create policy "Users can read own invites"
  on public.partner_invites for select using (auth.uid() = sender_id);

create policy "Users can insert own invites"
  on public.partner_invites for insert with check (auth.uid() = sender_id);

create policy "Users can update own invites"
  on public.partner_invites for update using (auth.uid() = sender_id);

-- 5. RLS policies so users can read their partner's data

create policy "Users can read partner profile"
  on public.profiles for select
  using (
    exists (
      select 1 from public.partnerships
      where status = 'active'
      and (
        (user1_id = auth.uid() and user2_id = profiles.id)
        or (user2_id = auth.uid() and user1_id = profiles.id)
      )
    )
  );

create policy "Users can read partner habits"
  on public.habits for select
  using (
    exists (
      select 1 from public.partnerships
      where status = 'active'
      and (
        (user1_id = auth.uid() and user2_id = habits.user_id)
        or (user2_id = auth.uid() and user1_id = habits.user_id)
      )
    )
  );

create policy "Users can read partner checkins"
  on public.checkins for select
  using (
    exists (
      select 1 from public.partnerships
      where status = 'active'
      and (
        (user1_id = auth.uid() and user2_id = checkins.user_id)
        or (user2_id = auth.uid() and user1_id = checkins.user_id)
      )
    )
  );

-- 6. RPC: search users by email or username (security definer bypasses RLS)
create or replace function public.search_users(search_query text)
returns table (id uuid, email text, username text)
language sql
security definer
as $$
  select p.id, p.email, p.username
  from public.profiles p
  where (
    p.email ilike '%' || search_query || '%'
    or p.username ilike '%' || search_query || '%'
  )
  and p.id != auth.uid()
  limit 10;
$$;

-- 7. RPC: check username availability
create or replace function public.is_username_available(desired_username text)
returns boolean
language sql
security definer
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(desired_username)
  );
$$;

-- 8. RPC: get invite info (callable without auth for the landing page)
create or replace function public.get_invite_info(code text)
returns json
language plpgsql
security definer
as $$
declare
  invite_row record;
begin
  select pi.id, pi.status, p.email, p.username
  into invite_row
  from public.partner_invites pi
  join public.profiles p on p.id = pi.sender_id
  where pi.invite_code = code;

  if not found then
    return json_build_object('error', 'Invite not found');
  end if;

  return json_build_object(
    'status', invite_row.status,
    'sender_email', invite_row.email,
    'sender_username', invite_row.username
  );
end;
$$;

-- 9. RPC: accept an invite-link and create partnership (must be authed)
create or replace function public.accept_partner_invite(code text)
returns json
language plpgsql
security definer
as $$
declare
  invite_row public.partner_invites%rowtype;
  existing record;
begin
  select * into invite_row
  from public.partner_invites
  where invite_code = code and status = 'pending';

  if not found then
    return json_build_object('error', 'Invite not found or already used');
  end if;

  if invite_row.sender_id = auth.uid() then
    return json_build_object('error', 'Cannot partner with yourself');
  end if;

  select id into existing from public.partnerships
  where status = 'active'
  and (user1_id = auth.uid() or user2_id = auth.uid()
    or user1_id = invite_row.sender_id or user2_id = invite_row.sender_id)
  limit 1;

  if found then
    return json_build_object('error', 'One of you already has an active partner');
  end if;

  insert into public.partnerships (user1_id, user2_id, status)
  values (invite_row.sender_id, auth.uid(), 'active');

  update public.partner_invites set status = 'accepted' where id = invite_row.id;

  return json_build_object('ok', true);
end;
$$;

-- 10. RPC: safely increment partner streak (with row-level lock)
create or replace function public.maybe_increment_partner_streak(
  p_partnership_id uuid,
  p_check_date date
)
returns integer
language plpgsql
security definer
as $$
declare
  p public.partnerships%rowtype;
  u1_done boolean;
  u2_done boolean;
begin
  select * into p
  from public.partnerships
  where id = p_partnership_id and status = 'active'
  for update;

  if not found then return 0; end if;

  if p.last_partner_streak_date = p_check_date then
    return p.partner_streak;
  end if;

  select coalesce(
    (select fully_completed from public.checkins
     where user_id = p.user1_id and date = p_check_date),
    false
  ) into u1_done;

  select coalesce(
    (select fully_completed from public.checkins
     where user_id = p.user2_id and date = p_check_date),
    false
  ) into u2_done;

  if u1_done and u2_done then
    update public.partnerships
    set partner_streak = partner_streak + 1,
        last_partner_streak_date = p_check_date
    where id = p_partnership_id;
    return p.partner_streak + 1;
  end if;

  return p.partner_streak;
end;
$$;
