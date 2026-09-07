# ProfiNavi v146 — snap.html stabilization

Base: v145
Page: `snap.html`

## Root causes

1. Work footer: `secondary-pages.js` synthesized service name and price from the master's services by photo index, even though `works` itself has no service/price relation.
2. Work hearts: saved work keys were stored only in `localStorage` (`pn_fav_works`), so there was no shared like state/count in Supabase and work identity depended on gallery position.
3. Publication: selected files went directly from file input to Storage and `works`; there was no edit/crop step.
4. Work identity: `replaceMasterWorks()` deleted and reinserted all work rows, which would invalidate UUID-based likes even when photos were unchanged.

## Fixes

- Removed service name and price from fullscreen work footer.
- Master identity block is aligned to the bottom edge of the viewer.
- Added persistent UUID work identity to public directory hydration.
- Added Supabase tables `work_likes` and `work_like_counts` with explicit grants and RLS.
- A heart is one combined action: like + save work to Favorites.
- Shared like count is read from Supabase for every work.
- Added Instagram-like pre-publication editor: drag, pinch/slider zoom, square crop, then publish.
- Multiple selected photos are still supported; each is edited in sequence.
- New work publication inserts only the new `works` row.
- `replaceMasterWorks()` now preserves existing row UUIDs for unchanged image URLs so accumulated likes are not reset by normal profile saves.
- Updated service-worker cache key to `profinavi-v146-snap-page`.

## Backend

Migration applied to Supabase project: `profinavi_v146_work_likes`.
Reproducible SQL included as `profinavi_v146_work_likes.sql`.

Security model:
- `work_like_counts`: public SELECT for anon/authenticated.
- `work_likes`: authenticated SELECT/INSERT/DELETE only; RLS limits rows to `auth.uid() = client_id`.
- No raw per-user like list is public.

## Verification

- Changed JS passes `node --check`.
- RLS/grants verified in Supabase.
- Authenticated transaction test (rolled back): one like was visible to its user and aggregate count changed 0 -> 1.
- Current production test rows remained at count 0 after rollback.
- Chromium UI harness verified:
  - 3 work tiles render from 3 UUID work records;
  - service/price text is absent in fullscreen viewer;
  - master and like/count occupy the bottom row;
  - authenticated heart test changes visible count 7 -> 8 and saves UUID key;
  - crop editor opens, zoom changes, and exports a processed JPEG;
  - Favorites -> Works resolves and displays the actual saved work image by UUID;
  - add-work flow uploads -> inserts new work -> updates profile without calling destructive replace.

## Files intentionally changed

- `snap.html`
- `secondary-pages.js`
- `supabase-client.js`
- `pn-ranking.js`
- `style.css` (v146 rules are scoped to the works page/crop editor)
- `sw.js`
- added `profinavi_v146_work_likes.sql`
- added this report

No `map.js`, booking, chat, admin, or unrelated business logic was changed.
