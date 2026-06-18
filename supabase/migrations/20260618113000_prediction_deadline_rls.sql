drop policy if exists "users insert their own predictions before lock" on public.predictions;
drop policy if exists "users update their own predictions before lock" on public.predictions;

create policy "users insert their own predictions before round deadline"
on public.predictions for insert
to authenticated
with check (
  user_id = auth.uid()
  and home_score >= 0
  and away_score >= 0
  and home_score <= 99
  and away_score <= 99
  and exists (
    select 1
    from public.matches m
    join public.rounds r on r.id = m.round_id
    where m.id = match_id
      and m.status = 'scheduled'
      and coalesce(r.prediction_deadline, m.match_at, now() + interval '1 day') > now()
  )
);

create policy "users update their own predictions before round deadline"
on public.predictions for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    join public.rounds r on r.id = m.round_id
    where m.id = match_id
      and m.status = 'scheduled'
      and coalesce(r.prediction_deadline, m.match_at, now() + interval '1 day') > now()
  )
)
with check (
  user_id = auth.uid()
  and home_score >= 0
  and away_score >= 0
  and home_score <= 99
  and away_score <= 99
);
