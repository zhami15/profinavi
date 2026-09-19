-- ProfiNavi v153 — create booking chat immediately and add an automatic client-side booking summary message.
-- Existing approval/decline workflow is preserved.

begin;

create or replace function public.booking_conversation_workflow()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cid uuid;
  booking_notice text;
  price_text text;
begin
  if tg_op = 'INSERT' and new.master_id is not null then
    insert into public.conversations(booking_id,client_id,master_id,closes_at)
    values(new.id,new.client_id,new.master_id,new.starts_at + interval '72 hours')
    on conflict(booking_id) do update set closes_at=excluded.closes_at
    returning id into cid;

    price_text := trim(trailing '.' from trim(trailing '0' from coalesce(new.price,0)::text));
    if price_text = '' then price_text := '0'; end if;

    booking_notice :=
      'Новая запись через ProfiNavi' || chr(10) ||
      'Услуга: ' || coalesce(nullif(new.service_name,''),'Услуга') || chr(10) ||
      'Дата: ' || to_char(new.starts_at at time zone 'Asia/Bishkek','DD.MM.YYYY HH24:MI') || chr(10) ||
      'Стоимость: ' || price_text || ' сом';

    insert into public.messages(conversation_id,sender_id,body,is_system)
    select cid,new.client_id,booking_notice,true
    where not exists(
      select 1
      from public.messages
      where conversation_id=cid
        and sender_id=new.client_id
        and is_system
        and body like 'Новая запись через ProfiNavi%'
    );
  end if;

  if tg_op = 'UPDATE'
     and new.status='approved'
     and old.status is distinct from new.status
     and new.master_id is not null then
    insert into public.conversations(booking_id,client_id,master_id,closes_at)
    values(new.id,new.client_id,new.master_id,new.starts_at + interval '72 hours')
    on conflict(booking_id) do update set closes_at=excluded.closes_at
    returning id into cid;

    insert into public.messages(conversation_id,sender_id,body,is_system)
    select cid,new.master_id,'Запись подтверждена мастером.',true
    where not exists(
      select 1
      from public.messages
      where conversation_id=cid
        and is_system
        and body='Запись подтверждена мастером.'
    );
  end if;

  return new;
end
$function$;

drop trigger if exists trg_booking_conversation_workflow on public.bookings;
create trigger trg_booking_conversation_workflow
after insert or update of status on public.bookings
for each row execute function public.booking_conversation_workflow();

commit;
