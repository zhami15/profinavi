# ProfiNavi v153 — master chats automation

Target page: `/master-chats.html`

## Root causes
- The chat list had no top margin, so it sat directly under the page header.
- `trg_booking_conversation_workflow` only fired after a booking status update to `approved`, so a pending booking had no conversation/message and could not appear immediately in master chats.

## Fixes
- Added a page-scoped `12px` top margin to `.master-chat-list`.
- Booking trigger now runs on booking INSERT as well as status UPDATE. On INSERT it creates the conversation and a single incoming automatic message from the client containing service, Bishkek-local booking date/time, and price.
- Existing approval system message is preserved.
- Master chat quick replies remain one-tap send buttons and are expanded/labeled for visibility.

## Scope
No unrelated pages were refactored. Shared backend trigger changed only because immediate chat creation cannot be implemented reliably from `master-chats.html` alone.
