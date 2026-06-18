alter table public.profiles
add column if not exists initial_points numeric(10,2) not null default 0,
add constraint profiles_initial_points_non_negative check (initial_points >= 0);

alter table public.teams
add column if not exists iso_code text,
add column if not exists group_name text;

alter table public.teams
add constraint teams_iso_code_lower check (iso_code is null or iso_code = lower(iso_code));

alter table public.rounds
add column if not exists phase text not null default 'group_stage',
add column if not exists round_number integer,
add column if not exists starts_at timestamptz,
add column if not exists prediction_deadline timestamptz;

update public.rounds
set round_number = sort_order
where round_number is null;

alter table public.rounds
alter column round_number set not null,
add constraint rounds_round_number_non_negative check (round_number >= 0),
add constraint rounds_phase_check check (
  phase in (
    'group_stage',
    'round_of_32',
    'round_of_16',
    'quarter_final',
    'semi_final',
    'third_place',
    'final'
  )
);

alter table public.matches
add column if not exists phase text,
add column if not exists weight numeric(8,2) not null default 1,
add column if not exists result_confirmed boolean not null default false;

update public.matches m
set phase = r.phase,
    weight = r.weight
from public.rounds r
where r.id = m.round_id
  and m.phase is null;

alter table public.matches
alter column phase set not null,
add constraint matches_weight_positive check (weight > 0),
add constraint matches_phase_check check (
  phase in (
    'group_stage',
    'round_of_32',
    'round_of_16',
    'quarter_final',
    'semi_final',
    'third_place',
    'final'
  )
);

alter table public.matches
drop constraint if exists matches_status_check;

alter table public.matches
add constraint matches_status_check check (
  status in ('scheduled', 'locked', 'finished', 'confirmed', 'cancelled')
);

alter table public.matches
drop constraint if exists matches_check1;

alter table public.matches
add constraint matches_score_status_check check (
  status in ('scheduled', 'locked', 'cancelled')
  or (
    status in ('finished', 'confirmed')
    and home_score is not null
    and away_score is not null
  )
);

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
    m.weight
  into match_record
  from public.matches m
  where m.id = p_match_id
    and m.status in ('finished', 'confirmed')
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
    count(pr.id) filter (where pr.points > 0 and pr.points >= 10 * m.weight) as exact_predictions,
    count(pr.id) filter (where pr.points > 0 and pr.points < 10 * m.weight) as correct_outcomes
  from public.predictions pr
  join public.matches m on m.id = pr.match_id
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
  coalesce(p.initial_points, 0) + coalesce(pt.prediction_points, 0) + coalesce(bt.bonus_points, 0) as total_points,
  coalesce(pt.exact_predictions, 0) as exact_predictions,
  coalesce(pt.correct_outcomes, 0) as correct_outcomes
from public.profiles p
left join prediction_totals pt on pt.user_id = p.id
left join bonus_totals bt on bt.user_id = p.id
order by total_points desc, exact_predictions desc, correct_outcomes desc, p.username;

revoke all on public.ranking_view from public;
revoke all on public.ranking_view from anon;
grant select on public.ranking_view to authenticated;
