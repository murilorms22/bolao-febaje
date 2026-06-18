create table if not exists public.manual_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fixture_key text not null,
  home_score integer not null check (home_score >= 0 and home_score <= 99),
  away_score integer not null check (away_score >= 0 and away_score <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fixture_key)
);

drop trigger if exists manual_predictions_set_updated_at on public.manual_predictions;

create trigger manual_predictions_set_updated_at
before update on public.manual_predictions
for each row execute function public.set_updated_at();

alter table public.manual_predictions enable row level security;

drop policy if exists "users read their own manual predictions" on public.manual_predictions;
drop policy if exists "users insert their own manual predictions" on public.manual_predictions;
drop policy if exists "users update their own manual predictions" on public.manual_predictions;
drop policy if exists "admins manage manual predictions" on public.manual_predictions;

create policy "users read their own manual predictions"
on public.manual_predictions for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

create policy "users insert their own manual predictions"
on public.manual_predictions for insert
to authenticated
with check (user_id = auth.uid());

create policy "users update their own manual predictions"
on public.manual_predictions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admins manage manual predictions"
on public.manual_predictions for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));
