-- ProfiNavi v146 — snap.html work likes/saves backend
-- Applied to project ydezwnuoeqlzmeuufrmo. Additive; does not delete business data.

begin;
create table if not exists public.work_likes (
  client_id uuid not null references public.profiles(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, work_id)
);
alter table public.work_likes enable row level security;
revoke all on table public.work_likes from anon, authenticated;
grant select, insert, delete on table public.work_likes to authenticated;

drop policy if exists work_likes_read_own on public.work_likes;
create policy work_likes_read_own on public.work_likes for select to authenticated using ((select auth.uid())=client_id);
drop policy if exists work_likes_insert_own on public.work_likes;
create policy work_likes_insert_own on public.work_likes for insert to authenticated with check ((select auth.uid())=client_id);
drop policy if exists work_likes_delete_own on public.work_likes;
create policy work_likes_delete_own on public.work_likes for delete to authenticated using ((select auth.uid())=client_id);

create table if not exists public.work_like_counts (
  work_id uuid primary key references public.works(id) on delete cascade,
  likes_count integer not null default 0 check (likes_count>=0),
  updated_at timestamptz not null default now()
);
alter table public.work_like_counts enable row level security;
revoke all on table public.work_like_counts from anon, authenticated;
grant select on table public.work_like_counts to anon, authenticated;
drop policy if exists work_like_counts_public_read on public.work_like_counts;
create policy work_like_counts_public_read on public.work_like_counts for select to anon, authenticated using (true);

insert into public.work_like_counts(work_id,likes_count,updated_at)
select w.id,count(l.work_id)::integer,now() from public.works w left join public.work_likes l on l.work_id=w.id group by w.id
on conflict(work_id) do update set likes_count=excluded.likes_count,updated_at=excluded.updated_at;

create schema if not exists private;
create or replace function private.profinavi_refresh_work_like_count(p_work_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_work_id is null then return; end if;
 if not exists(select 1 from public.works where id=p_work_id) then delete from public.work_like_counts where work_id=p_work_id; return; end if;
 insert into public.work_like_counts(work_id,likes_count,updated_at) values(p_work_id,(select count(*)::integer from public.work_likes where work_id=p_work_id),now())
 on conflict(work_id) do update set likes_count=excluded.likes_count,updated_at=excluded.updated_at;
end;$$;
revoke all on function private.profinavi_refresh_work_like_count(uuid) from public,anon,authenticated;
create or replace function private.profinavi_work_like_count_trigger() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin if tg_op='INSERT' then perform private.profinavi_refresh_work_like_count(new.work_id);return new; elsif tg_op='DELETE' then perform private.profinavi_refresh_work_like_count(old.work_id);return old; end if; return null; end;$$;
revoke all on function private.profinavi_work_like_count_trigger() from public,anon,authenticated;
drop trigger if exists profinavi_work_like_count on public.work_likes;
create trigger profinavi_work_like_count after insert or delete on public.work_likes for each row execute function private.profinavi_work_like_count_trigger();
commit;
