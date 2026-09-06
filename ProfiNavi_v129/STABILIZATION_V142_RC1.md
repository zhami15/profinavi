# ProfiNavi v142 RC1 — Controlled stabilization

Scope is intentionally narrow. No feature redesign.

## Confirmed regression fixed in this RC
The v138 clean schema installed a new booking/availability trigger set on top of legacy pre-v138 slot triggers. The old triggers were never explicitly removed. Two different trigger generations could process the same booking, making a genuinely free slot appear occupied during INSERT.

Run `profinavi_v142_booking_trigger_stabilization.sql` once in Supabase SQL Editor before testing booking.

The SQL does not delete business data. It removes only legacy triggers whose functions manipulate booking availability, then recreates the canonical v138 trigger set and verifies that no second legacy availability trigger remains.

## Frontend
Frontend is frozen from v141. The only package-level change is the PWA cache version, so the browser actually reloads the stabilized package. No unrelated UI or business logic was refactored in this RC.

## Test order
1. Save master's schedule.
2. Open same master as client.
3. Select a free slot.
4. Confirm booking.
5. Verify the chosen duration becomes unavailable.
6. Approve as master.
7. Verify chat.
8. Cancel a separate test booking and verify the slot reopens only if still in schedule.
