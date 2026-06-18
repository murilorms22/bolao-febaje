create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fifa_code text unique,
  flag_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null unique,
  weight numeric(8,2) not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete restrict,
  home_team_id uuid references public.teams(id) on delete restrict,
  away_team_id uuid references public.teams(id) on delete restrict,
  match_at timestamptz,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'locked', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id),
  check (
    (status <> 'finished' and (home_score is null or away_score is null))
    or (status = 'finished' and home_score is not null and away_score is not null)
  )
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  points numeric(10,2) not null default 0,
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table public.bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_key text not null,
  answer text not null,
  points numeric(10,2) not null default 0,
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_key)
);

create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger rounds_set_updated_at
before update on public.rounds
for each row execute function public.set_updated_at();

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create trigger predictions_set_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

create trigger bonus_predictions_set_updated_at
before update on public.bonus_predictions
for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
begin
  local_part := split_part(new.email, '@', 1);

  insert into public.profiles (id, username, display_name, must_change_password)
  values (
    new.id,
    lower(trim(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), local_part))),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = role_name
  );
$$;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.role <> new.role
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
    and not public.has_role('admin')
  then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.set_first_admin(admin_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'First admin already exists';
  end if;

  update public.profiles
  set role = 'admin'
  where username = lower(trim(admin_username));

  if not found then
    raise exception 'Profile % not found', admin_username;
  end if;
end;
$$;

revoke all on function public.set_first_admin(text) from public;
revoke all on function public.set_first_admin(text) from anon;
revoke all on function public.set_first_admin(text) from authenticated;
grant execute on function public.set_first_admin(text) to service_role;

create or replace function public.match_outcome(score_home integer, score_away integer)
returns text
language sql
immutable
as $$
  select case
    when score_home > score_away then 'home'
    when score_home < score_away then 'away'
    else 'draw'
  end;
$$;

create or replace function public.calculate_prediction_points(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  match_record record;
begin
  select
    m.id,
    m.home_score,
    m.away_score,
    r.weight
  into match_record
  from public.matches m
  join public.rounds r on r.id = m.round_id
  where m.id = p_match_id
    and m.status = 'finished'
    and m.home_score is not null
    and m.away_score is not null;

  if not found then
    raise exception 'Finished match % not found', p_match_id;
  end if;

  update public.predictions p
  set
    points = case
      when p.home_score = match_record.home_score and p.away_score = match_record.away_score
        then 10 * match_record.weight
      when public.match_outcome(p.home_score, p.away_score) = public.match_outcome(match_record.home_score, match_record.away_score)
        then 5 * match_record.weight
      else 0
    end,
    calculated_at = now()
  where p.match_id = match_record.id;
end;
$$;

create or replace view public.ranking_view
as
with prediction_totals as (
  select
    pr.user_id,
    coalesce(sum(pr.points), 0) as prediction_points,
    count(pr.id) filter (where pr.points > 0 and pr.points >= 10 * r.weight) as exact_predictions,
    count(pr.id) filter (where pr.points > 0 and pr.points < 10 * r.weight) as correct_outcomes
  from public.predictions pr
  join public.matches m on m.id = pr.match_id
  join public.rounds r on r.id = m.round_id
  group by pr.user_id
),
bonus_totals as (
  select
    user_id,
    coalesce(sum(points), 0) as bonus_points
  from public.bonus_predictions
  group by user_id
)
select
  p.id as user_id,
  p.username,
  p.display_name,
  coalesce(pt.prediction_points, 0) + coalesce(bt.bonus_points, 0) as total_points,
  coalesce(pt.exact_predictions, 0) as exact_predictions,
  coalesce(pt.correct_outcomes, 0) as correct_outcomes
from public.profiles p
left join prediction_totals pt on pt.user_id = p.id
left join bonus_totals bt on bt.user_id = p.id
order by total_points desc, exact_predictions desc, correct_outcomes desc, p.username;

revoke all on public.ranking_view from public;
revoke all on public.ranking_view from anon;
grant select on public.ranking_view to authenticated;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.rounds enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.bonus_predictions enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles are readable by signed users"
on public.profiles for select
to authenticated
using (true);

create policy "users update their own non-role profile fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins manage profiles"
on public.profiles for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "teams are readable by signed users"
on public.teams for select
to authenticated
using (true);

create policy "admins manage teams"
on public.teams for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "rounds are readable by signed users"
on public.rounds for select
to authenticated
using (true);

create policy "admins manage rounds"
on public.rounds for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "matches are readable by signed users"
on public.matches for select
to authenticated
using (true);

create policy "admins manage matches"
on public.matches for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "users read their own predictions"
on public.predictions for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

create policy "users insert their own predictions before lock"
on public.predictions for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'scheduled'
      and (m.match_at is null or m.match_at > now())
  )
);

create policy "users update their own predictions before lock"
on public.predictions for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and m.status = 'scheduled'
      and (m.match_at is null or m.match_at > now())
  )
)
with check (user_id = auth.uid());

create policy "admins manage predictions"
on public.predictions for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "users read their own bonus predictions"
on public.bonus_predictions for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

create policy "users manage their own bonus predictions"
on public.bonus_predictions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admins manage bonus predictions"
on public.bonus_predictions for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "settings are readable by signed users"
on public.app_settings for select
to authenticated
using (true);

create policy "admins manage settings"
on public.app_settings for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

insert into public.app_settings (key, value)
values
  ('default_initial_password', '"12345678"'::jsonb),
  ('external_api_enabled', 'false'::jsonb)
on conflict (key) do nothing;
