alter table if exists public.manual_predictions
drop constraint if exists manual_predictions_user_id_fkey;

alter table if exists public.manual_predictions
add constraint manual_predictions_user_id_fkey
foreign key (user_id)
references public.profiles(id)
on update cascade
on delete cascade;

alter table if exists public.predictions
drop constraint if exists predictions_user_id_fkey;

alter table if exists public.predictions
add constraint predictions_user_id_fkey
foreign key (user_id)
references public.profiles(id)
on update cascade
on delete cascade;

alter table if exists public.bonus_predictions
drop constraint if exists bonus_predictions_user_id_fkey;

alter table if exists public.bonus_predictions
add constraint bonus_predictions_user_id_fkey
foreign key (user_id)
references public.profiles(id)
on update cascade
on delete cascade;
