-- ProfiNavi v144 — /client.html backend additions
-- Additive/idempotent. Does NOT delete business data.
-- 1) Persist master save/favorite counts in a separate aggregate table.
-- 2) Add three admin-controlled Home banner slots.

begin;

create schema if not exists private;

create table if not exists public.master_save_counts (
  legacy_master_id integer primary key,
  saves_count integer not null default 0 check (saves_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.master_save_counts enable row level security;

drop policy if exists master_save_counts_public_read on public.master_save_counts;
create policy master_save_counts_public_read
on public.master_save_counts
for select
to anon, authenticated
using (true);

grant select on public.master_save_counts to anon, authenticated;

-- Rebuild current aggregate once.
insert into public.master_save_counts(legacy_master_id,saves_count,updated_at)
select mp.legacy_id, count(f.legacy_master_id)::integer, now()
from public.master_profiles mp
left join public.legacy_favorites f on f.legacy_master_id=mp.legacy_id
group by mp.legacy_id
on conflict (legacy_master_id) do update
set saves_count=excluded.saves_count,updated_at=excluded.updated_at;

create or replace function private.profinavi_refresh_master_saves_count(p_legacy_id integer)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_legacy_id is null then return; end if;
  insert into public.master_save_counts(legacy_master_id,saves_count,updated_at)
  values (
    p_legacy_id,
    (select count(*)::integer from public.legacy_favorites f where f.legacy_master_id=p_legacy_id),
    now()
  )
  on conflict (legacy_master_id) do update
    set saves_count=excluded.saves_count,updated_at=excluded.updated_at;
end;
$$;

revoke all on function private.profinavi_refresh_master_saves_count(integer) from public, anon, authenticated;

create or replace function private.profinavi_legacy_favorite_count_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    perform private.profinavi_refresh_master_saves_count(new.legacy_master_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform private.profinavi_refresh_master_saves_count(old.legacy_master_id);
    return old;
  else
    if old.legacy_master_id is distinct from new.legacy_master_id then
      perform private.profinavi_refresh_master_saves_count(old.legacy_master_id);
      perform private.profinavi_refresh_master_saves_count(new.legacy_master_id);
    else
      perform private.profinavi_refresh_master_saves_count(new.legacy_master_id);
    end if;
    return new;
  end if;
end;
$$;

revoke all on function private.profinavi_legacy_favorite_count_trigger() from public, anon, authenticated;

drop trigger if exists profinavi_legacy_favorite_count on public.legacy_favorites;
create trigger profinavi_legacy_favorite_count
after insert or delete or update of legacy_master_id
on public.legacy_favorites
for each row execute function private.profinavi_legacy_favorite_count_trigger();

create table if not exists public.home_banners (
  position smallint primary key check (position between 1 and 3),
  image_url text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.home_banners enable row level security;

drop policy if exists home_banners_public_read on public.home_banners;
create policy home_banners_public_read
on public.home_banners
for select
to anon, authenticated
using (true);

drop policy if exists home_banners_admin_manage on public.home_banners;
create policy home_banners_admin_manage
on public.home_banners
for all
to authenticated
using ((select private.is_profinavi_admin()))
with check ((select private.is_profinavi_admin()));

grant select on public.home_banners to anon, authenticated;
grant insert, update, delete on public.home_banners to authenticated;

commit;
