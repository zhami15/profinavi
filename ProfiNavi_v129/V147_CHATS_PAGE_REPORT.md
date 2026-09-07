# ProfiNavi v147 — chats.html / photo messages

Base: v146.2.

## Root causes

1. `chats.html` had no client bottom navigation at all.
2. The technical-support list entry used the app icon instead of a dedicated support glyph.
3. Booking status styling inherited old colored status rules instead of the neutral secondary-information color.
4. Both `messages` and `support_messages` were text-only in the database: `body` was required and no media field / private chat bucket existed.

## Fixes

- Added the 5-item client bottom navigation to `chats.html` (Главная / Поиск / Работы / Чаты / Избранное), with Чаты active.
- Replaced the support avatar with a centered inline headset/support-agent SVG.
- Forced chat-list booking/support status text to the neutral dark-gray secondary color.
- Added photo attachments to:
  - client ↔ master chat (`chat.html` / master chat UI),
  - user ↔ technical support (`support-chat.html`),
  - admin ↔ user support (`admin-support-chat.html`).
- Added preview/remove UI before sending a selected image.
- Photo-only and text+photo messages are supported; empty messages without either are still rejected.
- Added private `chat-media` Storage bucket (10 MB; JPEG/PNG/WebP/HEIC/HEIF).
- Added `image_path` to `messages` and `support_messages`.
- Chat image URLs are short-lived signed URLs and are generated only after Storage RLS authorizes the current participant/admin.
- Existing text-message APIs remain backward-compatible.

## Security / Supabase verification

- Migration `v147_chat_image_messages` was applied to the connected Supabase project.
- `chat-media` is private.
- Storage policies: authenticated participant/admin INSERT, participant/admin SELECT, uploader DELETE.
- Authorized support participant Storage INSERT policy passed in a rolled-back transaction; an unrelated authenticated UUID was correctly rejected by Storage RLS.
- Regular chat photo-only DB INSERT under authenticated RLS passed inside a transaction and was rolled back.
- Support photo-only DB INSERT under authenticated RLS passed inside a transaction and was rolled back.
- Empty regular message without text/image still fails `messages_body_check` as expected.

## Regression checks

- Node syntax checks passed for `supabase-client.js`, `chats.js`, `chat.js`, `support-chat.js`, `pn-admin.js`, `master.js`.
- Static DOM checks passed for the 5-item chats navigation, active state, attachment inputs/buttons, support headset icon, neutral status rule and image rendering hooks.
- Dependent client/master pages remain present; no unrelated page markup was modified.
- Service-worker cache key updated to `profinavi-v147-chats-photo-messages`.

## Files changed from v146.2

`chats.html`, `chats.js`, `chat.html`, `chat.js`, `support-chat.html`, `support-chat.js`, `admin-support.html`, `admin-support-chat.html`, `pn-admin.js`, `master.js`, `supabase-client.js`, `style.css`, `sw.js`.

Backend migration file added: `profinavi_v147_chat_images.sql`.
