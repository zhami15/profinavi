-- ProfiNavi v138 regression hardening
-- Server-side protection against overlapping bookings and chat writes after cancellation.

create schema if not exists private;

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
begin
  if new.master_id is null then
    return new;
  end if;

  v_end := coalesce(new.ends_at, new.starts_at + make_interval(mins => greatest(1,coalesce(new.duration_minutes,60))));
  if v_end <= new.starts_at then
    raise exception 'Некорректная длительность записи';
  end if;
  new.ends_at := v_end;
  new.duration_minutes := greatest(1, round(extract(epoch from (v_end-new.starts_at))/60)::integer);

  if new.status in ('pending','approved','completed') then
    if exists (
      select 1
      from public.bookings b
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

    -- Require free schedule coverage only for a new/rescheduled booking. A normal
    -- pending -> approved status change must not fail because this booking has
    -- already marked its own slots unavailable.
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

drop trigger if exists profinavi_booking_guard_v138 on public.bookings;
create trigger profinavi_booking_guard_v138
before insert or update of master_id,starts_at,ends_at,duration_minutes,status
on public.bookings
for each row execute function private.profinavi_booking_guard_v138();

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
  if new.is_available is not true then return new; end if;
  v_step := coalesce(private.profinavi_schedule_step_minutes(new.master_id),60);
  v_end := new.starts_at + make_interval(mins => v_step);
  new.ends_at := v_end;

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
  if tg_op in ('UPDATE','DELETE') and old.master_id is not null and old.status in ('pending','approved','completed') then
    v_old_end := coalesce(old.ends_at,old.starts_at + make_interval(mins => greatest(1,coalesce(old.duration_minutes,60))));
    v_step := coalesce(private.profinavi_schedule_step_minutes(old.master_id),60);
    update public.availability_slots s
       set is_available = true,
           ends_at = s.starts_at + make_interval(mins => v_step)
     where s.master_id = old.master_id
       and tstzrange(s.starts_at,s.starts_at + make_interval(mins => v_step),'[)') && tstzrange(old.starts_at,v_old_end,'[)')
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
  end if;

  if tg_op in ('INSERT','UPDATE') and new.master_id is not null and new.status in ('pending','approved','completed') then
    v_new_end := coalesce(new.ends_at,new.starts_at + make_interval(mins => greatest(1,coalesce(new.duration_minutes,60))));
    v_step := coalesce(private.profinavi_schedule_step_minutes(new.master_id),60);
    update public.availability_slots s
       set is_available = false,
           ends_at = s.starts_at + make_interval(mins => v_step)
     where s.master_id = new.master_id
       and tstzrange(s.starts_at,s.starts_at + make_interval(mins => v_step),'[)') && tstzrange(new.starts_at,v_new_end,'[)');
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
