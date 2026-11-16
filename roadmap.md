# Screen loading and caching
- [x] Add shared in-memory screen caching, navigation preloading and background refresh
- [x] Keep saved data consistent across screens and clear private caches on account changes
- [x] Verify repeat signed-in navigation, refresh and cache safety tests

# Phase 3
- [x] Personalized daily/three-day diet plans and meal replacements respecting profile and trial
- [x] Recipes, serving adjustments, and meal logging
- [x] Editable weekly/monthly grocery lists and export
- [x] Home nutrition totals, account cleanup, tests, and signed-in verification

Weekly/monthly diet generation supports dated administrator-granted access; payment checkout is not connected.

# Active workout correction
- [x] Start countdown automatically and verify pause, restart, and rest countdown
- [x] Show available start/peak positions honestly as still illustrations
- [ ] Real exercise animations — blocked on licensed demonstration media; RepDB free tier includes stills only

# Phase 4
- [x] Account-saved chat threads, streaming AI coach, contextual history and safety
- [x] Human coach scheduling, callback requests, booking status and cancellation
- [x] Account cleanup, tests and signed-in chat/callback verification
- [ ] Live coach appointment confirmation verification — needs an authorized coach/admin and real availability; management page is implemented

# Phase 6
- [ ] Payments — Paddle was disconnected by the user; awaiting decision on payment provider
- [ ] Create digital subscription products and checkout — awaiting plan prices and currency from user; live payments require seller verification
- [x] Server-enforced membership access and weekly/monthly AI nutrition entitlement
- [x] Protected admin area for users, manual memberships, coaches/bookings, app records and generation controls
- [x] Operational counts based on actual app records
- [ ] Compliance/security audit, account cleanup and end-to-end permission/payment checks

Phase 5 progress charts and check-ins are implemented; progress photos and background reminders are not.

# Complete app administration
- [x] Protected admin workspace, user search/details and validated record management
- [x] Plan catalog, manual activation/revocation and protected purchase/access history
- [x] Coaches, booking management, operational settings and real-record analytics
- [x] Account cleanup, permission tests and signed-in desktop/mobile verification of user edit, record add/delete, plan activation/revocation
- [x] Assign the first administrator — hello@socilet.com has administrator access

Payments, refunds, email delivery, production coach confirmation and full security/compliance audit remain unverified; no payment records are fabricated.

# Administration expansion
- [x] Granular staff workspace, private support notes and tickets with replies
- [x] In-app announcements, preferences and scheduled expiry reminders
- [x] Audited private-data export, deletion requests and date-filtered CSV reports
- [x] Persist generation outcomes and latency; show unavailable billing costs honestly
- [x] Permission tests and signed-in admin/user verification
- [ ] Payment integration and invoices/refunds — deferred by user; provider, prices and currency needed later

Email/push delivery and verified model billing costs are unavailable. Staff billing/coaching views are read-only; full management stays administrator-only. Scheduled reminders require publishing the new callback; live generation telemetry and scheduled delivery have not been independently exercised.

# Mobile login and panel verification
- [x] Add mobile OTP signup/login with validation and resend states
- [ ] Verify SMS provider setup and live delivery — requires configured SMS service and a real recipient
- [ ] Check signed-in user, staff and admin flows on desktop/mobile; user onboarding/support/check-in and major screens verified, remaining checks blocked by unavailable auth session
- [x] Run regression tests and record remaining external-service limitations — 51 tests passed

Coach reads reproduced a recursive slot/booking permission error; migration 0014 removes the recursion. Fresh signed-in coach verification and current staff/admin end-to-end checks need a preview sign-in. SMS provider enablement/delivery cannot be verified or configured with available tools; configure Phone under More → Users → Auth settings. Live payments remain deferred, and real AI generation/media/scheduled delivery are not fully verified.