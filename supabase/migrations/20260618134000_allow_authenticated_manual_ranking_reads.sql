drop policy if exists "users read their own manual predictions" on public.manual_predictions;
drop policy if exists "authenticated users read manual predictions for ranking" on public.manual_predictions;

create policy "authenticated users read manual predictions for ranking"
on public.manual_predictions for select
to authenticated
using (true);

drop policy if exists "profiles are readable by signed users" on public.profiles;

create policy "profiles are readable by signed users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read manual fixture results" on public.manual_fixture_results;

create policy "Authenticated users can read manual fixture results"
on public.manual_fixture_results for select
to authenticated
using (true);
