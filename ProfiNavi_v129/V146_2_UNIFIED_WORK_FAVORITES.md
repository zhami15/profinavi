# ProfiNavi v146.2 — unified work likes/favorites

- One canonical action: a row in `public.work_likes(client_id, work_id)` means both **like** and **saved to Favorites**.
- Public count remains the aggregate count of those same rows via `work_like_counts`; it is not a separate favorite system.
- `snap.html`, `favorites.html`, and work hearts on `client.html` use the same work UUID and the same Supabase action.
- `pn_fav_works` is no longer an active source of truth. Existing compatible entries are migrated once to `work_likes`, then the local key is removed.
- Anonymous users cannot create local-only work favorites, preventing divergence from the shared count.
- No schema change was required for v146.2.
