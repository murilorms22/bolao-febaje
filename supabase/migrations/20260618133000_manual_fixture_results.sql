create table if not exists public.manual_fixture_results (
  fixture_key text primary key,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manual_fixture_results enable row level security;

drop policy if exists "Authenticated users can read manual fixture results" on public.manual_fixture_results;
create policy "Authenticated users can read manual fixture results"
  on public.manual_fixture_results
  for select
  to authenticated
  using (true);

drop trigger if exists manual_fixture_results_updated_at on public.manual_fixture_results;
create trigger manual_fixture_results_updated_at
  before update on public.manual_fixture_results
  for each row execute function public.set_updated_at();
