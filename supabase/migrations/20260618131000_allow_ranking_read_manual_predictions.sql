drop policy if exists "users read their own manual predictions" on public.manual_predictions;

create policy "authenticated users read manual predictions for ranking"
on public.manual_predictions for select
to authenticated
using (true);
