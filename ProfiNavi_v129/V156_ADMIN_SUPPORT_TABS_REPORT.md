# ProfiNavi v156 — admin support tabs

Page: `/admin-support.html`

- Replaced two permanently visible contact groups with `Мастера / Клиенты` switch buttons matching the visual pattern used on `/admin.html`.
- Kept search, realtime refresh, unread counters, support stats, and navigation to `admin-support-chat.html` unchanged.
- Classification still verifies `master_profiles.user_id`, with `profiles.role` as fallback.
- No Supabase schema or policy changes were required.
