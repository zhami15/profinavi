-- ProfiNavi v142 RC1 — controlled stabilization / booking trigger cleanup
-- Purpose: remove legacy slot-reservation triggers left from pre-v138 versions.
-- No business data is deleted. No Auth users, profiles, services, bookings or slots are cleared.
-- Safe to run more than once.

begin;

-- 1) Remove ONLY legacy triggers that can reserve/release/check availability.
-- Keep the canonical v138 triggers installed by the clean schema.
do $$
declare
  r record;
  v_def text;
begin
  for r in
    select n.nspname as schema_name,
           c.relname as table_name,
           t.tgname as trigger_name,
           p.proname as function_name,
           p.oid as function_oid
      from pg_trigger t
      join pg_class c on c.oid=t.tgrelid
      join pg_namespace n on n.oid=c.relnamespace
      join pg_proc p on p.oid=t.tgfoid
     where not t.tgisinternal
       and n.nspname='public'
       and c.relname in ('bookings','availability_slots')
  loop
    v_def := lower(pg_get_functiondef(r.function_oid));

    if r.trigger_name in (
      'profinavi_00_booking_guard_v138',
      'profinavi_sync_booking_slots_v138',
      'profinavi_availability_guard_v138',
      'profinavi_close_cancelled_chat_v138'
    ) then
      continue;
    end if;

    if (
      r.table_name='bookings'
      and (
        v_def like '%availability_slots%'
        or lower(r.trigger_name) like '%slot%'
        or lower(r.function_name) like '%slot%'
        or lower(r.trigger_name) like '%reserve%'
        or lower(r.trigger_name) like '%release%'
        or lower(r.function_name) like '%reserve%'
        or lower(r.function_name) like '%release%'
      )
    ) or (
      r.table_name='availability_slots'
      and (
        v_def like '%from public.bookings%'
        or v_def like '%from bookings%'
        or lower(r.trigger_name) like '%booking%'
        or lower(r.function_name) like '%booking%'
      )
    ) then
      raise notice 'Dropping legacy trigger %.% -> %()', r.table_name, r.trigger_name, r.function_name;
      execute format('drop trigger if exists %I on %I.%I', r.trigger_name, r.schema_name, r.table_name);
    end if;
  end loop;
end
$$;

-- 2) Ensure the canonical trigger set exists exactly once.
drop trigger if exists profinavi_00_booking_guard_v138 on public.bookings;
create trigger profinavi_00_booking_guard_v138
before insert or update of master_id,service_id,starts_at,ends_at,duration_minutes,status
on public.bookings
for each row execute function private.profinavi_booking_guard_v138();

drop trigger if exists profinavi_sync_booking_slots_v138 on public.bookings;
create trigger profinavi_sync_booking_slots_v138
after insert or update or delete on public.bookings
for each row execute function private.profinavi_sync_booking_slots_v138();

drop trigger if exists profinavi_availability_guard_v138 on public.availability_slots;
create trigger profinavi_availability_guard_v138
before insert or update of master_id,starts_at,ends_at,is_available,schedule_enabled
on public.availability_slots
for each row execute function private.profinavi_availability_guard_v138();

drop trigger if exists profinavi_close_cancelled_chat_v138 on public.bookings;
create trigger profinavi_close_cancelled_chat_v138
after update of status on public.bookings
for each row execute function private.profinavi_close_cancelled_chat_v138();

-- 3) Verify no second legacy slot trigger remains.
do $$
declare
  r record;
  v_def text;
begin
  for r in
    select c.relname as table_name,
           t.tgname as trigger_name,
           p.proname as function_name,
           p.oid as function_oid
      from pg_trigger t
      join pg_class c on c.oid=t.tgrelid
      join pg_namespace n on n.oid=c.relnamespace
      join pg_proc p on p.oid=t.tgfoid
     where not t.tgisinternal
       and n.nspname='public'
       and c.relname in ('bookings','availability_slots')
       and t.tgname not in (
         'profinavi_00_booking_guard_v138',
         'profinavi_sync_booking_slots_v138',
         'profinavi_availability_guard_v138',
         'profinavi_close_cancelled_chat_v138'
       )
  loop
    v_def := lower(pg_get_functiondef(r.function_oid));
    if (r.table_name='bookings' and v_def like '%availability_slots%')
       or (r.table_name='availability_slots' and (v_def like '%from public.bookings%' or v_def like '%from bookings%')) then
      raise exception 'Legacy availability trigger still active: %.% -> %()', r.table_name, r.trigger_name, r.function_name;
    end if;
  end loop;
end
$$;

commit;

-- Read-only verification output. Expected canonical trigger names are shown here.
select c.relname as table_name,
       t.tgname as trigger_name,
       p.proname as function_name
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  join pg_proc p on p.oid=t.tgfoid
 where not t.tgisinternal
   and n.nspname='public'
   and c.relname in ('bookings','availability_slots')
 order by c.relname,t.tgname;
