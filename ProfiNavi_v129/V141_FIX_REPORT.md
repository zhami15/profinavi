# ProfiNavi v141 — schedule database sync fix

Fixed:
- master schedule save now waits for Supabase and reports success only after server verification;
- Profile → Address and information → Work schedule now updates both master_profiles.schedule_config and availability_slots;
- schedule save expands the future horizon to 62 days while preserving dates already manually edited in the calendar;
- general schedule changes rebuild the recurring 62-day grid intentionally;
- availability persistence preserves booked ticks that still belong to the current schedule, so cancelling a booking can reopen them correctly;
- master cache hydration preserves dates with disabled slot rows instead of forgetting fully closed days;
- backend errors are shown to the master instead of displaying a false “saved” popup.

No Supabase migration is required for this version.
