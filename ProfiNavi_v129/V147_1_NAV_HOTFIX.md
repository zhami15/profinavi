# ProfiNavi v147.1 — chats.html bottom navigation hotfix

- Removed the page-specific `chats-bottom-nav` class.
- Removed the desktop-only CSS override that centered/capped the chats navigation at 720px.
- `chats.html` now uses the canonical `.bottom-nav` markup and the exact same five icons/order as the other client pages.
- Only `Чаты` is marked active on chats.html.
- Bumped the service worker cache key so the corrected CSS/HTML is not masked by the old cached version.
