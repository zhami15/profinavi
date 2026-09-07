# ProfiNavi v145 — map.html fixes

Base: v144 (`ProfiNavi_v144_client_page`)
Scope: `map.html` behavior only. No Supabase schema/backend changes.

## Fixed
1. Filter title color now reflects the applied state and reliably returns to the default after reset, including before/without Leaflet initialization.
2. Per-filter `Сбросить` now resets the actually applied Price/Date/Area/Services filter, not only a temporary draft.
3. Master map marker is a true circular outer ring with a circular inner image, scoped to the fullscreen map page so Home markers are unchanged.
4. Clicking a master marker opens `profile.html?id=<legacy_id>`.
5. Bottom master card is a native profile link instead of a JS-only button handler.
6. Bottom master card enlarged to show master name, rating, prioritized active service and its current price.

## Backend/Supabase check
- Published directory exposes required profile/rating/coordinates/services data.
- Existing public RLS policies for `master_profiles`, `services`, `works`, and `availability_slots` are present.
- No public per-service popularity metric exists. The card therefore uses the first active service in existing `sort_order`, preserving current backend behavior and avoiding a backend/schema change.

## Regression checks
- `map.js` syntax: OK.
- Filter apply/reset UI checks: Price, Date, Area, Services — OK.
- Filter active/default computed colors — OK.
- Bottom card profile href and content — OK.
- Bottom card mobile size: 248px basis / 82px height — OK.
- Marker click handler routes to profile helper — OK.
- Marker outer/inner geometry — circular — OK.
- Shared Home marker styling kept unchanged by scoping new marker CSS to `.fullscreen-search-body`.
- Local file references checked on map/client/profile/snap/favorites/chats — OK.
