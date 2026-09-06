# ProfiNavi v144 — client.html page stabilization

Scope: `/client.html` and only the shared/dependent code required by the eight requested fixes.

## Implemented
1. Language selector is a dropdown: Рус / Кыр with Русский / Кыргызча options.
2. Removed the Home "Установить" card/button. Added a 3-image carousel with 3-second autoplay and manual swipe. Admin can replace each of the three images.
3. Reduced spacing between "МОИ ЗАПИСИ" and booking cards.
4. Centered category icon/text.
5. Replaced the Home "Карта" button with a city dropdown: Бишкек, Ош, Манас, Каракол, Нарын, Талас, Баткен. Бишкек is the default. Home directory and Home map are filtered by city, and the full map receives the selected city via query string.
6. Image/name/work clicks open the master profile at the top. Service click keeps the service deep-link behavior. Fixed missing-service query detection (`null` is no longer treated as service 0).
7. Master save counts are persisted in Supabase using `master_save_counts`, refreshed synchronously from `legacy_favorites` by trigger. Client/Profile read the persisted aggregate.
8. Reduced spacing between work thumbnails and service cards.

## Backend additions
`profinavi_v144_client_page_backend.sql` is additive/idempotent and does not delete business data. It creates:
- `master_save_counts`
- favorite-count refresh trigger/function
- `home_banners` (three admin-managed slots)

## Files changed from v143 RC2
- `client.html`
- `script.js`
- `style.css`
- `pn-i18n.js`
- `pn-ranking.js`
- `supabase-client.js`
- `profile.js` (dependent master profile navigation/save count)
- `map.js` (dependent selected-city map behavior)
- `admin.html` (required banner controls)
- `pn-admin.js` (required banner data/upload methods)
- `sw.js`
- added `profinavi_v144_client_page_backend.sql`

## Verification
- Top-level JS syntax: PASS (18 files)
- Inline JS syntax: PASS (9 blocks)
- HTML duplicate IDs/local static refs: PASS (23 pages)
- HTTP smoke: PASS (23 pages)
- Requirements audit: PASS (21/21 assertions)
- PNRanking city/save normalization: PASS
- Existing named function removal audit on changed JS files: PASS (0 existing named functions removed)
- Profile no-service-vs-service deep-link detection: PASS

Live Supabase connector was unavailable during this page pass, so the additive v144 SQL must be run once in Supabase before persistent save counts/admin banners are expected to work.
