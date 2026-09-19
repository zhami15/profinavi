# ProfiNavi v149 — master-profile fixes

Target page: `/master-profile.html`

## Fixed
- Rating is always visible, including `0.0` with zero reviews.
- Review empty state no longer duplicates; unnecessary review buttons/note removed.
- Pencil button under profile avatar removed.
- Publish flow no longer deletes/recreates services. Service IDs are preserved; removed services are soft-disabled with `is_active=false`, preserving booking history and FK integrity.
- New service is now a draft until Save; Cancel does not create it.
- Service duration uses hour/minute selectors instead of free text.
- Added explicit Save button before Delete service.
- About section pencil/change controls removed. Self-presentation and strengths blocks are directly clickable.
- Address editor now contains City / District / Address / map point, matching registration flow.
- Work schedule and time fields removed from Address editor and display.
- Address/place photo can be changed independently and is persisted in `master_profiles.location_image_url`.
- `pn-map.js` is now loaded on master-profile page.
- PWA cache key bumped to avoid stale v148 assets.

## Backend
- Applied migration `add_master_location_image` to Supabase.
- Verified live FK `bookings_service_id_fkey` and confirmed soft-disable of a referenced service succeeds inside a rolled-back transaction.
- `loadMasterBundle()` now hydrates only active services so soft-deleted services do not reappear.
