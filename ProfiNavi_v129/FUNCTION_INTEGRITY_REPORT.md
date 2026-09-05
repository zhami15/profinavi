# ProfiNavi v140 — Function Integrity Audit

Проверка выполнена после обнаружения двух регрессий класса “вызов функции остался, определение было удалено”.

## Найдено и исправлено

1. `openProfile()` / `openServiceProfile()` — восстановлены в v139. Без них карточка мастера и карточка услуги не открывали профиль.
2. `slotPreview()` — восстановлена в v140. Без неё вкладка Admin → Мастер → Расписание могла завершаться `ReferenceError`.

## Сравнение с v137 до большого регрессионного рефакторинга

После исправлений из v137 отсутствуют только функции, на которые **нет ни одного текущего вызова** и которые были заменены новой архитектурой:

- `bindProfileTabs` → заменена `profile.js::bindTabs`;
- `openLightbox` → заменена `openClientWork` / `openWorksViewer`;
- `pnHydratePublicMasterHome` → заменена `PNRanking.hydrate` + `pnHydrateRankedDirectory`;
- `renderChat` / `sendMsg` → старый demo-chat с автоответом удалён, используются реальные `chat.js`/Supabase messages;
- `notifyMaster` → была пустой no-op функцией, unread теперь вычисляется по backend/read timestamps.

## Автоматические проверки v140

- 56/56 ключевых feature signatures: PASS.
- 100 HTML/template event-handler attributes проверены: все прямые функции определены.
- `PNAdmin`, `PNData`, `PNAuth`, `PNBackendSync`, `PNRealtime`, `PNRanking`, `PNI18N`, `PNMap`: все используемые методы имеют определения.
- Общий скан прямых вызовов: неизвестных пользовательских функций нет; остаются только `renderHome`/`renderMasters` под безопасным `typeof` и строка CSS `translateX`.
- JS syntax: PASS.
- 10 inline JS blocks: PASS.
- 23 основных HTML страниц: HTTP 200.
- Local links / duplicate IDs / Service Worker refs: PASS.
- Duration parser: 5/5 PASS.
- 90-minute continuous slots / gap / overlap / adjacent slot: 4/4 PASS.

Backend clean reset повторно выполнять для v140 не требуется, если `profinavi_v138_clean_reset_FIXED_R2.sql` уже был успешно применён.
