# Exercise GIF animations
- [x] Map 401 catalog exercises to reviewed ExerciseGymGifsDB v1.1.0 GIFs (exact or labeled similar) with still fallback and tests
- [ ] Map remaining ~300 exercises (no reliable GIF match; AI matching stopped when AI credits ran out)

# Free exercise demonstrations
- [x] Import 27 exact-matched wger movement videos under CC BY-SA 4.0 with author/source/changes credits
- [x] Add silent looping playback and play/pause to exercise details and active workouts, preserving still-image fallback
- [x] Verify all 27 signed-in detail and active-workout demonstrations at 393px/1280px in light/dark themes (108 combinations), pause/play, no horizontal overflow, still fallback and nine regression tests

The previously suggested MIT repository explicitly disclaims knowledge of video provenance; it was not used. Unmatched catalog exercises retain stills. Native APK playback and a professional form review of every clip remain unverified.

# Current panel verification
- [x] Check user screens, all 13 admin sections and all 5 staff sections in light/dark themes at 393px and 1280px
- [x] Verify saved check-in, weight, measurement, meal totals, support ticket, user/staff reply, own-data download, privacy export request, conversation creation and callback persistence
- [x] Verify admin test-profile edit/readback, eight admin-only redirects, sign-out and signed-out access blocking
- [x] Run all 60 regression tests; no page errors, section alerts or horizontal overflow observed in completed checks
- [x] Active workout countdown change, pause/resume, set save/readback after reload and finish-to-workout navigation at 393px/1280px in both themes; no page errors or overflow
- [x] Live name/quantity food analysis returned estimated micronutrients and saved macros; grocery purchase/quantity persisted; live coach response persisted after reload
- [x] Diet generation — safety check no longer rejects safe words (eggplant, eggless, coconut milk, "instead of eggs"); a failing meal is regenerated (max 4) instead of discarding the plan; real 3-day vegetarian plan verified
- [ ] Actual SMS delivery, confirmed coach appointments and scheduled delivery — not exercised; payments remain disconnected and native Android checks need device/project

Test data and temporary elevated access were removed after verification. Checks were against the local preview with the live backend, not an installed APK; passing navigation and selected writes does not certify every action or external service.

# Android Back navigation
- [x] Improve shared cache freshness and avoid repeated account checks on rapid screen navigation
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
- [x] Add freely licensed real movement clips for 27 matched exercises; other exercises retain RepDB stills

# Phase 4
- [x] Account-saved chat threads, streaming AI coach, contextual history and safety
- [x] Human coach scheduling, callback requests, booking status and cancellation
- [x] Account cleanup, tests and signed-in chat/callback verification
- [x] Live coach appointment confirmation verified (coach slot → member request → coach confirm → member sees Confirmed); booked times now hidden from others

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

## Diet follow-up
- [x] Breakfast, lunch, dinner, water and workout reminders (phone pop-ups in the Android app after rebuild)
- [x] Missed-meal check-in: asks why, AI suggests quick alternatives, one-tap log

# Result analysis
- [x] 14-day diet, workout, water and sleep adherence scores with weight-trend check on Progress
- [x] Coach review explaining why results are slow, with weekly improvement steps (once per day)
- [x] Home alert when weight stalls or moves away from the goal; tests and phone check with a test member

# Requested diet and progress additions
- [x] Show vitamins/minerals on meal plan cards; open 1/3/7/30-day plans to all signed-in users (including expired trial), preserving the admin pause switch
- [x] Private progress photo upload, before/after selection and deletion
- [x] Weekly Diet, Workout, Consistency and Overall scores
- [x] Goal date estimate and starting/current weight and measurement comparisons
- [x] Verify photo upload/readback and scores in the browser; all 119 tests pass
- [ ] Complete live weekly/monthly diet generation verification — AI STAR long replies timed out; built-in fallback returned credit-limit 402. A real single-day structured response succeeded; full 7/30-day runs are not verified.

# Muscles Zone branding
- [x] Replace supplied logo across shared branding, web splash, preload and favicon
- [x] Rename user/admin/staff pages, metadata, coach identity and grocery exports; rename project and Capacitor display name while preserving app ID/domain
- [x] Verify new logo and name on landing/login at phone/desktop sizes and startup splash; all 119 tests pass, build OK
- [ ] Update and verify installed Android launcher icon/native splash — local Android project and device unavailable

# Current full-panel end-to-end check
- [x] Run 121 regression tests; signed-in user screens on phone, all 13 admin sections on phone/desktop and all five permission-scoped staff views on phone loaded without page errors or horizontal overflow
- [x] Verify check-in, weight, measurements, private photo upload/comparison/reload, reminder settings, food scan/meal diary, workout set reload/finish, coach reply persistence, own-data export and admin support reply
- [x] Correct coach stream cutoff: full streamed responses get 90 seconds instead of the 25-second non-stream timeout; reject truncated streams, regression tests and longer live reply/readback passed
- [x] Real seven-day diet generated and saved exactly seven days; temporary account permissions removed and remaining test fitness records cleaned up
- [ ] Monthly diet complete generation/readback — combined browser run exceeded the 600-second sandbox limit; no 30-day plan was observed, so monthly reliability remains unverified
- [ ] Remaining exhaustive checks — grocery edits, all admin mutations, scheduled delivery, real SMS and native Android not exercised in this run; payments remain disconnected

# Camera photo upload
- [x] Add separate camera capture and gallery upload controls to food scanning and progress photos without changing scan or storage rules
- [x] Verify signed-in camera-input and gallery selection, decoded food preview, progress upload and decoded readback after reload; test photos removed, 20 nutrition/progress tests passed
- [ ] Verify actual camera launch on installed Android — requires a physical device; desktop verification uses file chooser input rather than a real camera

# Account language
- [ ] Ask signed-in users without a saved language to choose before onboarding or any panel; allow later changes
- [ ] Persist account language and translate visible app labels, forms, messages and content without changing stored values or control behavior
- [ ] Apply the saved language to coach chat and all personalized generators
- [ ] Verify first-login selection, saved-language reload, language changes, translated navigation/forms and live coach response; run regression tests
