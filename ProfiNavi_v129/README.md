# ProfiNavi v136 — Technical support chat

## Admin panel

- `/admin-login.html` — admin phone OTP login.
- `/admin.html` — all master profiles, including drafts and blocked profiles.
- `/admin-master.html?id=<legacy_id>` — edit profile, services, works, schedule and status.
- Admin authorization is based on protected Supabase `app_metadata.profinavi_role=admin`, never on client-side role flags.
- Server allowlist contains the approved admin phone and is closed to anon/authenticated clients.
- Admin media changes use the existing `master-media` / `service-media` Storage buckets with dedicated RLS.
- `admin_audit_log` records admin profile/service/work/schedule edits.
- Blocked master profiles remain in the database but are hidden from public clients.

## Current test admin

Phone: `+996 550 119 604`
Display name: `Admin`
Test OTP while `PN_TEST_MODE=true`: `111111`


## Availability / booking calendar fix

- Client booking calendar now reloads the selected master's live `availability_slots` directly from Supabase.
- Public profile hydration preserves slots instead of overwriting them with an empty slot map.
- Booking time rows are derived from the master's real available times, not a fixed 09:00–20:30 grid.
- Public master bundle includes up to 62 days of future availability.
- Booking creation atomically claims a free slot in Supabase. A second booking for the same master/time is rejected.
- Pending/approved/completed bookings keep their slot unavailable; declined/cancelled bookings release it.
- Re-saving a master's schedule cannot accidentally reopen a slot with an active booking.
- New bookings must resolve to a real published master and active service.

# ProfiNavi v131

Статический PWA-клиент ProfiNavi для Netlify/Vercel + Supabase backend.

## Авторизация

- Email не используется. Идентификатор пользователя — номер телефона Кыргызстана `+996...`.
- Клиенты и мастера входят/регистрируются по OTP; пароль и восстановление пароля не нужны.
- Сейчас `PN_TEST_MODE=true` в `supabase-client.js`.
- В тестовом режиме кнопка «Получить код» создаёт серверный OTP-запрос, но SMS не отправляется. Демо-код: `111111`.
- Демо-запрос действует 10 минут, повторная отправка ограничена, неверные попытки считаются, успешный код одноразовый.
- Когда появится SMS-провайдер: переключить `PN_TEST_MODE=false`. Тогда используются штатные Supabase Phone OTP `signInWithOtp({ phone })` + `verifyOtp({ phone, token, type: 'sms' })`.

## Реальный рейтинг мастера — v131

Публичный рейтинг больше не является простым средним.

- Шкала отзывов: 1–5 звёзд.
- В рейтинг входит только **последний отзыв каждого уникального клиента** этому мастеру. Все исторические отзывы остаются видимыми.
- Свежие отзывы имеют больший вес. Half-life: **180 дней** — через 180 дней вес отзыва примерно в 2 раза ниже нового.
- Используется Bayesian prior: базовая средняя платформы `4.6` с весом 5 виртуальных отзывов. После накопления достаточного объёма данных prior автоматически адаптируется к среднему платформы в безопасном диапазоне 4.2–4.8.
- Один первый отзыв 1★ даёт примерно `4.00`, а один первый 5★ — примерно `4.67`; один случайный отзыв не может мгновенно уничтожить или искусственно поднять рейтинг.
- `reviews_count` — число **уникальных клиентов**, чья последняя оценка участвует в рейтинге.
- Без реальных отзывов рейтинг не рисуется: UI показывает `Нет отзывов` или `Новый мастер`.

## Top Score — скрытая сортировка

Пользователь Top Score не видит. Он используется для основной рекомендательной выдачи.

- Качество / Bayesian Rating — **35%**.
- Свежие завершённые/подтверждённые записи — **25%** (half-life 30 дней).
- Надёжность мастера — **15%**.
- Доверие к объёму уникальных отзывов — **10%** (логарифмическая шкала; 1 отзыв не равен 80).
- Полезная свежая активность — **10%**: реальные свободные слоты, услуги, свежие работы, обновлённый профиль.
- Заполненность профиля — **5%**.
- Если минимум 3 из последних 5 уникальных отзывов ≤2★, Top Score умножается на `0.70`; если минимум 3 из 5 ≤3★ — на `0.85`.
- Если нет свободных слотов в ближайшие 14 дней, Top Score умножается на `0.75`.
- Формула и внутренний breakdown находятся в Supabase (`top_score`, `ranking_breakdown`) и не вычисляются доверенно во frontend.

## Шанс новым мастерам

Новый мастер получает показы, а не искусственные звёзды.

- 1–7 день: вероятность exploration-слота около **20%**.
- 8–14 день: **15%**.
- 15–30 день: **10%**.
- После 30 дней специальное продвижение прекращается.
- За один показ резервируется максимум один exploration-слот примерно на позициях 3–8; остальные позиции определяются Top Score.
- Exploration стабилен в рамках сессии/дня, поэтому выдача не прыгает при каждом рендере.

## Автоматический пересчёт

- Триггеры пересчитывают рейтинг/Top Score при изменениях отзывов, записей, услуг, работ, слотов и важных полей профиля.
- Supabase Cron `profinavi-ranking-daily` дополнительно запускает `refresh_all_master_rankings()` ежедневно в `03:00 UTC` / `09:00 Asia/Bishkek`, чтобы естественно обновлялись веса старых отзывов и актуальность слотов.

## Мастера и ID

- Старое ограничение `legacy_id=0` для каждого нового мастера удалено.
- Supabase автоматически выдаёт каждому новому мастеру уникальный постоянный `legacy_id` через серверный sequence + `BEFORE INSERT` trigger. Публичный ID больше не зависит от frontend.
- Динамические мастера загружаются в общий каталог, карту, профиль, запись, подтверждение, чаты и избранное.
- Ручные рейтинги `4.7–4.9` и демонстрационные отзывы удалены из интерфейса.

## Supabase

- Project: `ydezwnuoeqlzmeuufrmo`.
- `familyflow_state` удалена; FamilyFlow-only пользователь и старые ProfiNavi test users удалены.
- `profinavi_demo_otp_requests` — закрытая служебная таблица тестового OTP.
- Service-role key во frontend отсутствует.
- Основные RLS-политики включены.

## Архитектура

- `pn-data.js` — каталожный fallback для исходных карточек.
- `pn-ranking.js` — UI-состояния рейтинга, Top Score ordering, newcomer exploration и динамический каталог.
- `supabase-client.js` — Auth, directory, bookings, services, works, slots, reviews, conversations, realtime sync.
- `sw.js` + `pn-pwa.js` + `manifest.webmanifest` — PWA/install/offline app-shell.
- `pn-map.js` — общая карта/геокодинг.

## Чат

Заявка создаётся со статусом `pending`. Чат появляется только после подтверждения мастером: backend создаёт `conversation`; новые сообщения разрешены до `starts_at + 72 hours`.

## v129 clean catalog
- Built-in demo masters and demo works removed.
- Public directory is loaded only from published Supabase master_profiles.
- First load clears legacy demo browser cache.


## v131 — media upload + master publication hardening

- Фото профиля, обложка и работы мастера загружаются в Supabase Storage bucket `master-media`; локальные `data:` preview больше не считаются сохранённым медиа.
- При первом входе v131 пытается автоматически мигрировать оставшиеся от v129 `data:image/...` аватар/обложку/работы/фото услуг в Storage до обычной hydration.
- Фото услуг загружаются в отдельный bucket `service-media`.
- Путь каждого файла начинается с `auth.uid()`, поэтому существующие Storage RLS разрешают мастеру запись только в собственную папку.
- Размер изображения проверяется во frontend: максимум 10 МБ; принимаются image MIME types, разрешённые Storage.
- Кнопка публикации ждёт очередь сохранений и перед `is_published=true` повторно сохраняет профиль, работы, услуги и расписание.
- Исправлена регистрационная карта: удалена двойная инициализация; стартовый центр карты больше не считается выбранной точкой.
- Исправлен серверный public ID: создан реальный trigger `master_profiles_assign_legacy_id`; существующие строки с NULL backfill-ятся sequence ID.
- При входе другого мастера локальный master-cache очищается и привязывается к `user_id`, чтобы данные двух кабинетов не смешивались на одном устройстве.
- Hydration теперь явно записывает пустые services/works/slots из Supabase, чтобы удалённые на сервере данные не оставались в localStorage.


## v131 — client auth/logout
- Added client logout in the account modal.
- Logout revokes the Supabase session and clears user-specific local caches (bookings, chats, reviews, favorites and auth-bound master caches) without deleting server data.
- Client registration preserves an existing profile role instead of forcing `client`.
- Visiting client-login while already authenticated returns to the client app unless `?force=1` is supplied.
## v136 — Technical Support
- Added one persistent support thread per authenticated account (`support_threads`).
- Added immutable support messages (`support_messages`) and per-user read state (`support_reads`).
- Client and master chat lists show “Техническая поддержка” as a regular dialog.
- Admin has `admin-support.html` inbox and `admin-support-chat.html` reply screen.
- Support data is stored in Supabase and syncs across devices; it is not limited by booking chat 72-hour rules.
