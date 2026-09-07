-- ProfiNavi v148 — defence-in-depth uniqueness for account phone numbers.
-- Applied to Supabase project ydezwnuoeqlzmeuufrmo.
create unique index if not exists profiles_phone_normalized_unique
on public.profiles ((regexp_replace(phone, '\D', '', 'g')))
where phone is not null and regexp_replace(phone, '\D', '', 'g') <> '';
