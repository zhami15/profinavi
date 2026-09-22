# ProfiNavi v155 — admin support grouping

Target page: `/admin-support.html`

- Renamed `Обновить` to `Поиск`.
- Renamed the top `Мастера` navigation button to `Главная` (still points to `admin.html`).
- Split all support dialogs into two visible groups: `Мастера` and `Клиенты`.
- Classification uses live `master_profiles.user_id` as the primary source, with `profiles.role` as fallback.
- Search filters both groups without hiding either section.
- Existing realtime refresh, unread counters, navigation to `admin-support-chat.html`, and admin logout were preserved.
- No database schema change was required.
