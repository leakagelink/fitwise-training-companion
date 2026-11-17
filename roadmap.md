# Android Back navigation
- [x] Add splash, screen-entry and control animations with reduced-motion support
- [x] Handle native Back through app-owned navigation and stay open at the first screen
- [x] Add regression tests for previous-screen and first-screen behavior
- [ ] Verify on installed Android APK — local Android project/device unavailable; App plugin needs native sync and APK rebuild

# Uploaded logo
- [x] Use the supplied logo across shared app branding, administration and the favicon
- [x] Add the supplied logo to the web opening screen
- [ ] Verify native Android splash — local Android project is not available here

# Screen loading and caching
- [x] Add shared in-memory screen caching, navigation preloading and background refresh
- [x] Keep saved data consistent across screens and clear private caches on account changes
- [x] Verify repeat signed-in navigation, refresh and cache safety tests

# Mobile header and Android rebuild
- [x] Apply shared device safe-area spacing to screens, sticky headers and admin menu
- [x] Verify mobile safe-area layout and provide PowerShell APK rebuild commands
- [ ] Verify installed Android status bar and browser redirect — Android project/configuration and device are not available here

Public landing/login and 13 signed-in user/staff/legal screens checked at phone/desktop widths in both themes with simulated device insets; all 13 admin sections, opened menu and sticky header after scrolling also passed using a temporary test account. Screenshots reviewed, no horizontal overflow or runtime errors; three routing tests passed. Temporary admin access removed. Actual Android insets and browser navigation require the local Android project/device; publishing is needed for the HTTPS wrapper to receive this update. Coach management and active workout session headers still require authorized/populated flows for verification.

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
- [ ] Complete all signed-in user, staff and admin write flows; navigation and all admin sections checked, user onboarding/support/check-in verified; full generation and external delivery remain unverified
- [x] Run regression tests and record remaining external-service limitations — 51 tests passed

Coach reads reproduced a recursive slot/booking permission error; migration 0014 removes the recursion. Fresh signed-in verification confirmed the coach screen and callback dialog load; all 12 admin sections opened without alerts and staff permissions loaded. Mobile signup/signin validation, email switching and coach layout were checked at phone/desktop sizes in light/dark themes. SMS provider enablement/delivery cannot be verified or configured with available tools; configure Phone under More → Users → Auth settings. Live payments remain deferred, and real AI generation/media/scheduled delivery and every write flow are not fully verified.
# Mobile admin optimization
- [x] Modernize admin navigation, overview and management screens; verify both themes and mobile/desktop interactions

Modern admin overview uses real metric tiles, activity distribution and quick access; grouped navigation, theme control, record styling and user avatars stay scoped to administration. All 13 sections checked at 320px, 393px and 1280px in both themes without overflow or runtime errors; quick access, user details and plan add/cancel verified. All 15 selected regression tests passed; build OK. No data or permission rules changed.
- [x] Add admin bottom navigation and send admin logins only to administration
- [x] Check role redirects and bottom navigation in both themes on phone/desktop

Added Overview/Users/Plans/Support/More bottom navigation on mobile/tablet, replaced administrator user-app links with sign-out, and shared verified role routing for email/SMS completion and user-only screens. Signed-in admin redirects from auth and ten user entry paths, all 13 sections, bottom controls, edit-form cancellation and sign-out checked in light/dark phone/desktop views; 20 selected tests passed. Live SMS delivery remains outside this verification.
- [x] Adapt all admin sections, navigation, records and edit forms for phones
- [x] Verify signed-in phone/tablet/desktop navigation and forms without page overflow

All 13 admin sections checked at 320px, 393px, 768px and 1280px; user details and plan/profile edit dialogs opened without page overflow. Mobile menu and forms visually checked; 13 admin regression tests passed. No management data or access rules changed.
