# ProfiNavi v150 — master.html fixes

Target page: `/master.html`

## Fixed

1. Added top spacing above the Today / Income / Rating KPI row equal to its bottom spacing.
2. Rating always renders as a numeric value (`0.0` when there are no reviews).
3. Master schedule is now month-scoped:
   - schedule arrows navigate by month;
   - the visible table contains the whole selected month;
   - days / time / interval apply only to the selected month;
   - an unconfigured next month stays closed with gray crosses;
   - month settings are stored inside `master_profiles.schedule_config.monthConfigs`;
   - the old automatic 62-day future expansion is no longer used by `saveScheduleConfig`;
   - a one-time v150 migration keeps the current month and disables old auto-generated future availability until each future month is configured.

## Backend

No schema migration was required. `schedule_config` is JSONB and accepts the new `monthConfigs` object. Existing RLS policies already allow a master to manage only their own `master_profiles` and `availability_slots` rows.

## Verification

- All project JavaScript files pass `node --check`.
- Logic harness verified: September has 30 columns, an unconfigured October has zero available slots / gray crosses only, configuring October does not modify September.
- Supabase JSONB update was tested in a transaction and rolled back.
- Browser launch was attempted, but the environment's Chromium policy blocks localhost/file URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`), so interactive rendering was validated through the DOM-generation logic harness rather than live browser navigation.
