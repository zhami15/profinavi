# ProfiNavi v154 — admin clients screen

Target page: `/admin.html`

Changes:
- renamed the toolbar button from `Обновить` to `Поиск` while preserving fresh-data reload behavior;
- removed `CLIENT.HTML` and the explanatory `Три изображения для карусели BEAUTY NAVIGATOR.` text from the banner block;
- added `Мастера / Клиенты` admin tabs inside the same page;
- added ordinary-client list, search, stats and block/unblock controls;
- masters and active admin accounts are excluded from the client list;
- blocking is enforced through Supabase Auth ban via the admin-only `profinavi-admin-clients` Edge Function;
- service-role credentials remain server-side and are never exposed to the browser;
- bumped the PWA cache to `profinavi-v154-admin-clients`.
