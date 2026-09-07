# ProfiNavi v148 — login/logout and account-flow fixes

Base: v147.2
Scope: client/master authentication flow, client account popup, master registration form, required shared auth backend.

## Root causes
1. `client.html` decided whether to open the master cabinet only from localStorage `pn_master_session`. An active Supabase client session with an existing `master_profiles` row was ignored, so the user was sent to master login again.
2. `profinavi-test-phone-auth` created an OTP request before checking whether the phone was already registered. During verification it reused an existing Auth user even for a registration flow. The frontend then updated/upserted that existing profile, allowing account data to be overwritten.
3. `master-login.html` did not hydrate the registration form from the active client session and always used the new-master OTP path.
4. The master-registration city list was a separate hardcoded 25-city list and did not match `client.html`.
5. `#accountModal` inherited the mobile bottom-sheet `.modal { align-items:end }` layout.

## Fixes
- Added `pnEnterMasterFromClient()`:
  - active client + existing `master_profiles` -> opens `master.html` without OTP;
  - active client without master profile -> opens master registration with client context;
  - anonymous -> master login.
- Master registration now pre-fills current client name and phone. Both remain editable.
- Same already-verified phone while converting the logged-in client to a master does not require another OTP.
- If the logged-in client changes phone while becoming a master, the new phone is checked before OTP and the verified phone is applied to the same Auth user, rather than creating another identity.
- New client/master registration rejects an already registered phone before an OTP request is created.
- Client login rejects a missing account before OTP creation.
- Master login rejects a missing account or an account without `master_profiles` before OTP creation.
- OTP lookup now also matches `purpose`, preventing one flow's OTP request from being consumed by another flow.
- Added an authenticated Authorization header to the auth Edge Function when a session exists.
- Added defence-in-depth unique normalized phone index on `public.profiles`.
- Master cities now exactly match Home/client cities: Бишкек, Ош, Манас, Каракол, Нарын, Талас, Баткен.
- `#accountModal` is centered on mobile and desktop.
- Service Worker cache bumped to `profinavi-v148-login-logout`.

## Supabase
Applied:
- Edge Function `profinavi-test-phone-auth` version 6.
- Unique index `profiles_phone_normalized_unique`.

Files included for traceability:
- `profinavi_v148_phone_auth_edge.ts`
- `profinavi_v148_auth_guard.sql`

## Validation
- Existing master/client switch unit test: direct `master.html`, no login route.
- Existing client without master: routes to `master-login.html?from=client#register`.
- Master registration browser test:
  - name/phone prefilled;
  - both fields editable;
  - same phone: uniqueness check, no OTP, direct master registration;
  - changed phone: uniqueness check then OTP.
- Client registration browser test:
  - occupied phone precheck blocks before OTP;
  - free phone proceeds to OTP.
- Client account popup browser test at 390x844: computed `align-items:center` and card center equals viewport center.
- City list parity test: master registration list exactly equals `PN_HOME_CITIES`.
- All 18 external JS files pass `node --check`.
- All 9 inline JS blocks pass syntax check.
- Existing named functions in modified files preserved; only new helpers added.
- All 23 HTML pages return HTTP 200 in local smoke test.
- All local asset references resolve.
- Database uniqueness guard tested with a duplicate phone attempt; it was rejected and no test row remained.
- Existing database row counts remained unchanged by tests.
