-- Ensures the admin UI columns exist in databases where the Phase 3 schema
-- was not applied, or was applied only partially. This migration is additive
-- and preserves existing rows.

alter table public.matches
add column if not exists phase text default 'group_stage',
add column if not exists weight integer default 1,
add column if not exists result_confirmed boolean default false;

update public.matches
set
  phase = coalesce(nullif(phase, ''), 'group_stage'),
  weight = coalesce(weight, 1),
  result_confirmed = coalesce(result_confirmed, false);

alter table public.matches
alter column phase set default 'group_stage',
alter column phase set not null,
alter column weight type integer using greatest(1, round(coalesce(weight, 1)::numeric)::integer),
alter column weight set default 1,
alter column weight set not null,
alter column result_confirmed set default false,
alter column result_confirmed set not null;

alter table public.rounds
add column if not exists phase text default 'group_stage',
add column if not exists round_number integer default 1,
add column if not exists starts_at timestamptz,
add column if not exists prediction_deadline timestamptz;

update public.rounds
set
  phase = coalesce(nullif(phase, ''), 'group_stage'),
  round_number = coalesce(round_number, sort_order, 1);

alter table public.rounds
alter column phase set default 'group_stage',
alter column phase set not null,
alter column round_number set default 1,
alter column round_number set not null;

alter table public.teams
add column if not exists fifa_code text,
add column if not exists iso_code text,
add column if not exists flag_url text,
add column if not exists group_name text,
add column if not exists updated_at timestamptz default now();

update public.teams
set updated_at = coalesce(updated_at, now());

alter table public.teams
alter column updated_at set default now();
