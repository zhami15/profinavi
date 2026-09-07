-- ProfiNavi v147 — private image messages for regular and support chats
-- Applied to Supabase project ydezwnuoeqlzmeuufrmo.
-- Additive: preserves all existing text messages, conversations and support threads.

begin;

alter table public.messages add column if not exists image_path text;
alter table public.support_messages add column if not exists image_path text;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check
check (length(trim(both from body)) > 0 or image_path is not null);

alter table public.support_messages drop constraint if exists support_messages_body_check;
alter table public.support_messages add constraint support_messages_body_check
check (
  char_length(trim(both from body)) <= 5000
  and (char_length(trim(both from body)) >= 1 or image_path is not null)
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'chat-media','chat-media',false,10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists chat_media_insert on storage.objects;
create policy chat_media_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='chat-media'
  and (storage.foldername(name))[3] = (select auth.uid())::text
  and (
    (
      (storage.foldername(name))[1]='conversation'
      and exists (
        select 1 from public.conversations c
        where c.id::text=(storage.foldername(name))[2]
          and ((select auth.uid())=c.client_id or (select auth.uid())=c.master_id)
      )
    )
    or
    (
      (storage.foldername(name))[1]='support'
      and exists (
        select 1 from public.support_threads t
        where t.id::text=(storage.foldername(name))[2]
          and ((select auth.uid())=t.user_id or (select private.is_profinavi_admin()))
      )
    )
  )
);

drop policy if exists chat_media_select on storage.objects;
create policy chat_media_select
on storage.objects for select to authenticated
using (
  bucket_id='chat-media'
  and (
    (
      (storage.foldername(name))[1]='conversation'
      and exists (
        select 1 from public.conversations c
        where c.id::text=(storage.foldername(name))[2]
          and ((select auth.uid())=c.client_id or (select auth.uid())=c.master_id)
      )
    )
    or
    (
      (storage.foldername(name))[1]='support'
      and exists (
        select 1 from public.support_threads t
        where t.id::text=(storage.foldername(name))[2]
          and ((select auth.uid())=t.user_id or (select private.is_profinavi_admin()))
      )
    )
  )
);

drop policy if exists chat_media_delete_own on storage.objects;
create policy chat_media_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id='chat-media'
  and (storage.foldername(name))[3] = (select auth.uid())::text
);

commit;
