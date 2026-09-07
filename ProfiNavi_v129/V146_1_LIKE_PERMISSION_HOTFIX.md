# ProfiNavi v146.1 — Snap like permission hotfix

Scope: snap.html work like/save persistence only.

## Root cause
`setWorkLike()` used Supabase `.upsert()` on `public.work_likes`. PostgreSQL requires UPDATE privilege for `INSERT ... ON CONFLICT DO UPDATE`, while v146 intentionally granted only SELECT/INSERT/DELETE. This caused `permission denied for table work_likes`.

## Live Supabase hotfix
Applied migration `profinavi_v146_work_likes_upsert_hotfix` to the current ProfiNavi project. It grants authenticated UPDATE and adds an own-row UPDATE RLS policy (`auth.uid() = client_id`), so already deployed v146 works immediately.

## Frontend hardening
`setWorkLike()` now uses `.insert()` instead of `.upsert()`. Duplicate key code `23505` is treated as idempotent success. This means future builds no longer depend on UPDATE permission to add a like/save.

## Cache
Service Worker cache bumped to `profinavi-v146-1-snap-like-hotfix`.
