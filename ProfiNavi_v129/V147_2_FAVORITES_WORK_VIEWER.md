# ProfiNavi v147.2 — favorites work viewer

Scope: `favorites.html` and the shared work-viewer code required by that page.

## Root cause
Saved work cards in `renderFavorites()` used `onclick="openProfile(...)"`, so clicking a saved work always navigated to the master profile even though the saved item already had a canonical Supabase `work_id`.

## Fix
- Added the existing Works full-screen viewer markup to `favorites.html`.
- Added `openFavoriteWork(workId)` which resolves the user's saved works by canonical UUID and opens the clicked work in the viewer.
- Extended `openWorksViewer(index)` with an optional source list while preserving the original one-argument behavior used by `snap.html`.
- Kept the heart button as a separate stop-propagation action for removing the work from Favorites.
- Bumped the service-worker cache to v147.2.

## Backend verification
No schema change is required. The live Supabase check confirmed that the saved `work_id` resolves to an existing work row with image URL and a published master.

## Verification
- Changed runtime files: `favorites.html`, `secondary-pages.js`, `sw.js`.
- Existing named functions removed: 0.
- Favorites work branch no longer calls `openProfile()`.
- `favorites.html` includes the same work viewer controls/list used by Works.
- `snap.html` retains its one-argument `openWorksViewer(...)` call.
- Top-level JS syntax: PASS (18 files).
- Inline JS syntax: PASS (9 blocks).
- HTTP smoke: PASS (23 HTML pages).
- Target duplicate IDs/local refs: PASS.
