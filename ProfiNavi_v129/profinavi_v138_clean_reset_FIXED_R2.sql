-- ProfiNavi v138 CLEAN RESET
-- Run ONCE on the existing ProfiNavi Supabase project before deploying v138 stable.
--
-- This intentionally deletes all application/test business data while preserving:
--   * the Supabase project itself and API keys;
--   * Auth identities/sessions at the server level (the v138 frontend locally signs out once);
--   * Edge Functions;
--   * Storage buckets/objects (old unreferenced media will no longer be visible in the app);
--   * public.profinavi_admin_allowlist and admin app_metadata.
--
-- After this reset the public ProfiNavi catalog is empty. Create a master/client again
-- through the normal UI. The first newly created master receives legacy_id = 1.

begin;

-- Remove all user-generated/test application rows. Order is explicit for clarity;
-- CASCADE also covers any dependent rows that were added by older test builds.
truncate table
  public.support_reads,
  public.support_messages,
  public.support_threads,
  public.conversation_reads,
  public.messages,
  public.conversations,
  public.reviews,
  public.bookings,
  public.availability_slots,
  public.works,
  public.services,
  public.legacy_favorites,
  public.admin_audit_log,
  public.master_profiles,
  public.profiles,
  public.profinavi_demo_otp_requests
restart identity cascade;

-- With the old built-in catalog removed, public master IDs can cleanly restart at 1.
-- Older ProfiNavi builds created this sequence with MINVALUE 11, so lower the
-- sequence boundary before restarting it. The next generated ID will be 1.
alter sequence if exists public.profinavi_legacy_master_id_seq
  minvalue 1
  start with 1
  restart with 1;

-- ProfiNavi v138 stable backend hardening
-- Apply to the ProfiNavi Supabase project before/with v138 stable.
-- Goals:
-- 1) canonical server-side booking data from master/service records;
-- 2) continuous availability coverage for the whole service duration;
-- 3) database-level protection against overlapping active bookings, including races;
-- 4) reserve/release every affected availability slot;
-- 5) close booking chat immediately after cancellation/decline;
-- 6) clients may only INSERT pending bookings for themselves.

create schema if not exists private;
create extension if not exists btree_gist;

-- Keep two concepts separate: whether the time belongs to the master's current
-- schedule and whether it is presently free from bookings. This prevents a
-- cancelled booking from reopening a time the master has since removed.
alter table public.availability_slots
  add column if not exists schedule_enabled boolean not null default true;

-- Older builds could create duplicate ticks. Keep the safest row (an occupied
-- row wins over an available row) before creating the unique key used by the
-- schedule upserts and release logic.
with ranked as (
  select id,
         row_number() over (
           partition by master_id,starts_at
           order by is_available asc, created_at desc, id
         ) as rn
    from public.availability_slots
)
delete from public.availability_slots s
using ranked r
where s.id=r.id and r.rn>1;

create unique index if not exists availability_slots_master_start_uq
  on public.availability_slots(master_id,starts_at);

create or replace function private.profinavi_schedule_step_minutes(p_master uuid)
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select greatest(5, coalesce(nullif((mp.schedule_config->>'step')::integer,0),60))
  from public.master_profiles mp
  where mp.user_id = p_master
$$;
revoke all on function private.profinavi_schedule_step_minutes(uuid) from public, anon, authenticated;


create or replace function private.profinavi_tick_in_schedule(p_master uuid,p_tick timestamptz)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_cfg jsonb;
  v_local timestamp;
  v_dow integer;
  v_time time;
  v_start time;
  v_end time;
  v_days text;
  v_custom boolean := false;
begin
  select coalesce(mp.schedule_config,'{}'::jsonb) into v_cfg
    from public.master_profiles mp where mp.user_id=p_master;
  if not found then return false; end if;
  v_local := p_tick at time zone 'Asia/Bishkek';
  v_dow := extract(dow from v_local)::integer;
  v_time := v_local::time;
  begin v_start := coalesce(nullif(v_cfg->>'start',''),'10:00')::time; exception when others then v_start := '10:00'::time; end;
  begin v_end := coalesce(nullif(v_cfg->>'end',''),'19:00')::time; exception when others then v_end := '19:00'::time; end;
  if v_time < v_start or v_time >= v_end then return false; end if;
  v_days := coalesce(v_cfg->>'days','Ежедневно');
  if v_days='Ежедневно' then return true; end if;
  if v_days='Будни' then return v_dow between 1 and 5; end if;
  if v_days='Выходные' then return v_dow in (0,6); end if;
  if v_days='Пн–Сб' then return v_dow between 1 and 6; end if;
  if v_days in ('По выбранным дням','Выбрать дни','Индивидуально') then
    select exists(
      select 1 from jsonb_array_elements_text(coalesce(v_cfg->'workDays','[]'::jsonb)) x(v)
       where case
         when x.v ~ '^[0-6]$' then x.v::integer=v_dow
         when upper(x.v)='ПН' then v_dow=1
         when upper(x.v)='ВТ' then v_dow=2
         when upper(x.v)='СР' then v_dow=3
         when upper(x.v)='ЧТ' then v_dow=4
         when upper(x.v)='ПТ' then v_dow=5
         when upper(x.v)='СБ' then v_dow=6
         when upper(x.v)='ВС' then v_dow=0
         else false end
    ) into v_custom;
    return coalesce(v_custom,false);
  end if;
  return true;
end
$$;
revoke all on function private.profinavi_tick_in_schedule(uuid,timestamptz) from public, anon, authenticated;

-- Backfill active legacy rows before adding the overlap constraint.
update public.bookings b
set duration_minutes = coalesce(nullif(b.duration_minutes,0), nullif(s.duration_minutes,0), 60),
    ends_at = b.starts_at + make_interval(mins => coalesce(nullif(b.duration_minutes,0), nullif(s.duration_minutes,0), 60))
from public.services s
where b.service_id = s.id
  and b.status in ('pending','approved')
  and (b.ends_at is null or b.duration_minutes is null or b.duration_minutes <= 0);

update public.bookings b
set duration_minutes = coalesce(nullif(b.duration_minutes,0),60),
    ends_at = b.starts_at + make_interval(mins => coalesce(nullif(b.duration_minutes,0),60))
where b.status in ('pending','approved')
  and (b.ends_at is null or b.duration_minutes is null or b.duration_minutes <= 0);

-- Canonical booking validation. Name sorts before older ProfiNavi booking triggers,
-- so availability is checked before any legacy reservation trigger can flip a slot.
create or replace function private.profinavi_booking_guard_v138()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_end timestamptz;
  v_step integer;
  v_tick timestamptz;
  v_need_coverage boolean := false;
  v_service record;
  v_master record;
  v_client_name text;
begin
  if new.master_id is null then
    raise exception 'Мастер не найден';
  end if;

  -- New bookings are canonicalized from server records. A browser cannot forge
  -- another price, duration, master name, or service/master pairing.
  if tg_op = 'INSERT' then
    if coalesce(new.status,'pending') <> 'pending' then
      raise exception 'Новая запись должна иметь статус pending';
    end if;
    if new.client_id is null or new.service_id is null then
      raise exception 'Не указан клиент или услуга';
    end if;
    if new.starts_at <= now() then
      raise exception 'Нельзя записаться на прошедшее время';
    end if;

    select mp.user_id, mp.legacy_id, mp.profile_name
      into v_master
      from public.master_profiles mp
     where mp.user_id = new.master_id
       and mp.is_published = true
       and coalesce(mp.is_blocked,false) = false;
    if not found then raise exception 'Мастер не найден или профиль недоступен'; end if;

    select s.id, s.master_id, s.name, s.price, s.new_price,
           greatest(1,coalesce(nullif(s.duration_minutes,0),60)) as duration_minutes
      into v_service
      from public.services s
     where s.id = new.service_id
       and s.master_id = new.master_id
       and s.is_active = true;
    if not found then raise exception 'Эта услуга больше недоступна'; end if;

    select p.name into v_client_name from public.profiles p where p.id = new.client_id;

    new.legacy_master_id := v_master.legacy_id;
    new.master_name := coalesce(v_master.profile_name,'Мастер ProfiNavi');
    new.service_name := v_service.name;
    new.duration_minutes := v_service.duration_minutes;
    new.price := case
      when v_service.new_price is not null
       and v_service.new_price >= 0
       and v_service.new_price < v_service.price then v_service.new_price
      else v_service.price
    end;
    new.client_name := coalesce(v_client_name,new.client_name,'Клиент ProfiNavi');
    new.ends_at := new.starts_at + make_interval(mins => new.duration_minutes);
    new.status := 'pending';
  end if;

  v_end := coalesce(new.ends_at, new.starts_at + make_interval(mins => greatest(1,coalesce(new.duration_minutes,60))));
  if v_end <= new.starts_at then raise exception 'Некорректная длительность записи'; end if;
  new.ends_at := v_end;
  new.duration_minutes := greatest(1,round(extract(epoch from (v_end-new.starts_at))/60)::integer);

  if new.status in ('pending','approved','completed') then
    if exists (
      select 1 from public.bookings b
       where b.master_id = new.master_id
         and b.id is distinct from new.id
         and b.status in ('pending','approved','completed')
         and tstzrange(
               b.starts_at,
               coalesce(b.ends_at,b.starts_at + make_interval(mins => greatest(1,coalesce(b.duration_minutes,60)))),
               '[)'
             ) && tstzrange(new.starts_at,v_end,'[)')
    ) then
      raise exception 'Это время уже недоступно';
    end if;

    -- A normal pending -> approved transition must not re-check slots because
    -- this booking has already reserved them. New/rescheduled bookings do.
    if tg_op = 'INSERT' then
      v_need_coverage := true;
    else
      v_need_coverage := old.status not in ('pending','approved','completed')
        or old.master_id is distinct from new.master_id
        or old.starts_at is distinct from new.starts_at
        or old.ends_at is distinct from new.ends_at
        or old.duration_minutes is distinct from new.duration_minutes;
    end if;

    if v_need_coverage then
      v_step := coalesce(private.profinavi_schedule_step_minutes(new.master_id),60);
      v_tick := new.starts_at;
      while v_tick < v_end loop
        if not exists (
          select 1 from public.availability_slots s
           where s.master_id = new.master_id
             and s.is_available = true
             and s.starts_at = v_tick
        ) then
          raise exception 'Это время уже недоступно';
        end if;
        v_tick := v_tick + make_interval(mins => v_step);
      end loop;
    end if;
  end if;
  return new;
end
$$;
revoke all on function private.profinavi_booking_guard_v138() from public, anon, authenticated;

drop trigger if exists profinavi_00_booking_guard_v138 on public.bookings;
drop trigger if exists profinavi_booking_guard_v138 on public.bookings;
create trigger profinavi_00_booking_guard_v138
before insert or update of master_id,service_id,starts_at,ends_at,duration_minutes,status
on public.bookings
for each row execute function private.profinavi_booking_guard_v138();

-- PostgreSQL exclusion constraints are concurrency-safe: two transactions cannot
-- commit overlapping pending/approved bookings for the same master.
alter table public.bookings drop constraint if exists bookings_no_master_overlap_v138;
alter table public.bookings
  add constraint bookings_no_master_overlap_v138
  exclude using gist (
    master_id with =,
    tstzrange(starts_at,ends_at,'[)') with &&
  )
  where (master_id is not null and status in ('pending','approved'));

-- Client-side INSERT is intentionally narrow. Status changes continue through
-- set_booking_status(), which contains participant/transition authorization.
drop policy if exists bookings_client_create on public.bookings;
create policy bookings_client_create
on public.bookings
for insert
to authenticated
with check (
  (select auth.uid()) = client_id
  and status = 'pending'
  and master_id is not null
  and service_id is not null
);

create or replace function private.profinavi_availability_guard_v138()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_step integer;
  v_end timestamptz;
begin
  v_step := coalesce(private.profinavi_schedule_step_minutes(new.master_id),60);
  v_end := new.starts_at + make_interval(mins => v_step);
  new.ends_at := v_end;
  if new.schedule_enabled is not true then
    new.is_available := false;
    return new;
  end if;
  if new.is_available is not true then return new; end if;

  if exists (
    select 1 from public.bookings b
     where b.master_id = new.master_id
       and b.status in ('pending','approved','completed')
       and tstzrange(
             b.starts_at,
             coalesce(b.ends_at,b.starts_at + make_interval(mins => greatest(1,coalesce(b.duration_minutes,60)))),
             '[)'
           ) && tstzrange(new.starts_at,v_end,'[)')
  ) then
    new.is_available := false;
  end if;
  return new;
end
$$;
revoke all on function private.profinavi_availability_guard_v138() from public, anon, authenticated;

drop trigger if exists profinavi_availability_guard_v138 on public.availability_slots;
create trigger profinavi_availability_guard_v138
before insert or update of master_id,starts_at,ends_at,is_available
on public.availability_slots
for each row execute function private.profinavi_availability_guard_v138();

create or replace function private.profinavi_sync_booking_slots_v138()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_old_end timestamptz;
  v_new_end timestamptz;
  v_step integer;
begin
  if tg_op in ('UPDATE','DELETE')
     and old.master_id is not null
     and old.status in ('pending','approved','completed') then
    v_old_end := coalesce(old.ends_at,old.starts_at + make_interval(mins => greatest(1,coalesce(old.duration_minutes,60))));
    v_step := coalesce(private.profinavi_schedule_step_minutes(old.master_id),60);
    update public.availability_slots s
       set is_available = s.schedule_enabled,
           ends_at = s.starts_at + make_interval(mins => v_step)
     where s.master_id = old.master_id
       and tstzrange(s.starts_at,s.starts_at + make_interval(mins => v_step),'[)')
           && tstzrange(old.starts_at,v_old_end,'[)')
       and not exists (
         select 1 from public.bookings b
          where b.master_id = s.master_id
            and b.status in ('pending','approved','completed')
            and (tg_op='DELETE' or b.id is distinct from old.id)
            and tstzrange(
                  b.starts_at,
                  coalesce(b.ends_at,b.starts_at + make_interval(mins => greatest(1,coalesce(b.duration_minutes,60)))),
                  '[)'
                ) && tstzrange(s.starts_at,s.starts_at + make_interval(mins => v_step),'[)')
       );

    -- Older frontend versions could delete occupied slot rows while saving the
    -- master's schedule. Recreate any missing ticks when a booking is released.
    insert into public.availability_slots(master_id,starts_at,ends_at,schedule_enabled,is_available)
    select old.master_id,
           g.tick,
           g.tick + make_interval(mins => v_step),
           true,
           true
      from generate_series(old.starts_at,v_old_end,make_interval(mins => v_step)) as g(tick)
     where g.tick < v_old_end
       and private.profinavi_tick_in_schedule(old.master_id,g.tick)
       and not exists (
         select 1 from public.bookings b
          where b.master_id = old.master_id
            and b.status in ('pending','approved','completed')
            and (tg_op='DELETE' or b.id is distinct from old.id)
            and tstzrange(
                  b.starts_at,
                  coalesce(b.ends_at,b.starts_at + make_interval(mins => greatest(1,coalesce(b.duration_minutes,60)))),
                  '[)'
                ) && tstzrange(g.tick,g.tick + make_interval(mins => v_step),'[)')
       )
    on conflict(master_id,starts_at) do update
      set ends_at = excluded.ends_at,
          schedule_enabled = excluded.schedule_enabled,
          is_available = excluded.is_available;
  end if;

  if tg_op in ('INSERT','UPDATE')
     and new.master_id is not null
     and new.status in ('pending','approved','completed') then
    v_new_end := coalesce(new.ends_at,new.starts_at + make_interval(mins => greatest(1,coalesce(new.duration_minutes,60))));
    v_step := coalesce(private.profinavi_schedule_step_minutes(new.master_id),60);
    update public.availability_slots s
       set is_available = false,
           ends_at = s.starts_at + make_interval(mins => v_step)
     where s.master_id = new.master_id
       and tstzrange(s.starts_at,s.starts_at + make_interval(mins => v_step),'[)')
           && tstzrange(new.starts_at,v_new_end,'[)');
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end
$$;
revoke all on function private.profinavi_sync_booking_slots_v138() from public, anon, authenticated;

drop trigger if exists profinavi_sync_booking_slots_v138 on public.bookings;
create trigger profinavi_sync_booking_slots_v138
after insert or update or delete on public.bookings
for each row execute function private.profinavi_sync_booking_slots_v138();

create or replace function private.profinavi_close_cancelled_chat_v138()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status in ('cancelled','declined') and old.status is distinct from new.status then
    update public.conversations
       set closes_at = least(coalesce(closes_at,now()),now())
     where booking_id = new.id;
  end if;
  return new;
end
$$;
revoke all on function private.profinavi_close_cancelled_chat_v138() from public, anon, authenticated;

drop trigger if exists profinavi_close_cancelled_chat_v138 on public.bookings;
create trigger profinavi_close_cancelled_chat_v138
after update of status on public.bookings
for each row execute function private.profinavi_close_cancelled_chat_v138();

-- Normalize future slot interval lengths to each master's configured schedule step.
update public.availability_slots s
set ends_at = s.starts_at + make_interval(mins => coalesce(private.profinavi_schedule_step_minutes(s.master_id),60))
where s.starts_at >= now();


commit;
