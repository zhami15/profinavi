# ProfiNavi v140 — regression + function integrity report

## Frontend/static

- JavaScript syntax: PASS
- Inline JavaScript syntax: PASS (10 inline blocks)
- Local `src`/`href`: PASS
- Duplicate HTML ids: PASS
- Service Worker core refs: PASS (48 refs)
- HTTP smoke: PASS for 22 key pages
- ZIP integrity: PASS

## Booking/calendar unit regression

Проверены реальные функции из `supabase-client.js` / `booking.js`:

- `90 мин` → 90: PASS
- `1,5 часа` → 90: PASS
- `01:30` → 90: PASS
- `2 ч 15 мин` → 135: PASS
- 90-минутная услуга на 30-минутной сетке требует 10:00/10:30/11:00: PASS
- разрыв внутри диапазона отклоняется: PASS
- пересечение существующей записи обнаруживается: PASS
- соседний непересекающийся диапазон не блокируется: PASS

## Clean-start

`pn-data.js` использует одноразовый marker `pn_clean_schema_v138` и при первом запуске stable очищает:

- старые client/master booking/chat/support caches;
- dynamic master/profile/service/review/slot caches;
- локальный Supabase auth token текущего браузера;
- pending OTP/sessionStorage.

Языковые/геолокационные/map-настройки не удаляются.

## Backend clean reset

`profinavi_v138_clean_reset_FIXED_R2.sql` содержит в одном запуске:

1. очистку всех старых `public`-данных ProfiNavi;
2. очистку demo OTP request rows;
3. сохранение `profinavi_admin_allowlist`;
4. restart публичного master ID с 1;
5. `schedule_enabled`;
6. unique master/start slot key;
7. canonical server-side booking price/duration/service/master;
8. continuous availability coverage;
9. GiST exclusion от одновременных пересекающихся bookings;
10. reserve/release всего диапазона услуги;
11. актуальный schedule-aware release;
12. серверное закрытие booking-chat после cancelled/declined;
13. узкий RLS INSERT booking только pending/own client.

## Ограничение текущей среды

В момент финализации Supabase connector стал недоступен. Поэтому SQL-файл полностью подготовлен и локально проверен на состав/целостность, но его live-выполнение в production Supabase из этой сессии не было подтверждено.

После запуска SQL рекомендуется короткий live smoke из `DEPLOY_V138.md`.
