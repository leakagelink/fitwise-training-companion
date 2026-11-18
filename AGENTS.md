<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Features live in src/features/<area>; server functions in *.functions.ts with requireSupabaseAuth, AI helpers in src/lib/ai/*.server.ts — keeps secrets and model calls server-side.
- Signed-in pages live under src/routes/_authenticated/_app (onboarding gate in its beforeLoad) — one place enforces auth + onboarding.
- Fitness math (targets, trial, streak) lives in src/lib/fitness.ts with tests in src/test — single source for rules shown in UI and enforced on the server.
- Account deletion must delete every user-owned table without FK cascade in features/account — keep its table list in sync with new tables.
- Exercise catalog is the RepDB free-tier JSON bundled at src/data/exercises.json (lazy-loaded on client); plans store its text ids and the server validates AI-chosen ids against it — license forbids redistribution, needs visible "Exercise data by RepDB" attribution.
- Active workout set edits are written to localStorage (fa-pending-sets) and flushed to the database with retry — survives flaky network.
- Workout clocks use wall time; demonstrations map exact catalog IDs to credited CC BY-SA CDN clips with labeled-still fallback — keeps timing and movement guidance honest.
- Nutrition plans store validated recipe days as JSON, while consumed meals keep independent nutrient snapshots and groceries keep independent editable rows — later plan edits must not rewrite past intake or purchased lists.
- Coach threads use route-derived IDs and persisted UIMessage parts; authenticated raw streaming runs through the Gateway SDK with one durable generation lock per thread — prevents cross-thread history and duplicate simultaneous answers.
- Human-coach booking status is backend-controlled with protected role checks and unique active slots; requests remain pending until staff confirm — prevents false confirmations and double booking.
- Screen queries share a per-router memory-only cache, intent preloading, stale background refresh and identity-change clearing; writes invalidate related views and active sessions disable focus refresh — speeds repeat navigation without persisting health data or overwriting live set edits.
- Administration lives outside the onboarding shell under the authenticated gate; every admin server handler verifies roles before privileged imports, and editable resources use a strict field allowlist — prevents client permission or ownership escalation.
- Membership access uses dated, revocable permission snapshots shared by generation endpoints; manual grants never write purchase rows — keeps authorization consistent and financial history honest.
- Admin data mutations and membership/role changes record activity in transactional database functions; account cleanup anonymizes financial/access history through a shared server helper — preserves history without keeping deleted user identifiers.
- Onboarding body validation uses one client-safe helper for both field errors and continuation eligibility — keeps visible feedback consistent with the button state.
- Staff capabilities live in a protected permission table and are checked before privileged operations; the staff workspace never reuses full-admin endpoints — limits staff to assigned duties.
- Support notes are staff-only, private reads/exports are audited, and account-owned support/inbox data cascades from profiles — protects support privacy and account cleanup.
- Notification reminders use a managed authenticated job and unique membership deduplication keys with preferences — avoids duplicate or unwanted in-app reminders.
- Generation telemetry records outcomes and latency without prompts, photos or responses; unknown token costs remain null — reports usage without inventing billing data.
- Mobile authentication uses hosted SMS OTP verification with explicit signup versus existing-user intent and international phone normalization — no custom OTP storage or bypasses.
- Booked-slot visibility uses a current-user security-definer existence check rather than querying booking policies from slot policies — prevents circular RLS evaluation without broadening visibility.

- Admin screens use a drawer below desktop width and record summaries below tablet width; scoped touch-target and form sizing applies to admin dialogs too — keeps every management section usable on small screens without changing access rules.
- Login destinations and user-surface redirects share an authenticated server-verified workspace query; role lookup failures stop routing — prevents administrators entering user onboarding or workout screens.
- Admin overview presentation stays in a browser-safe component with real overview counts; workspace-scoped styling leaves the user app unchanged.
- The root app viewport owns safe-area padding; sticky headers/sidebars and portalled admin navigation use shared safe-area tokens — prevents device status-bar overlap without adding duplicate screen padding.
- Shared Logo and splash components use one CDN asset pointer; startup fades out after hydration and image decoding, immediately under reduced motion — keeps branding consistent without blocking page readiness.
- Screen motion fades the existing viewport on pathname changes without remounting layouts; shared control and card effects respect reduced motion — preserves live form/workout state and fixed navigation.
- Android Back is registered once after hydration through the Capacitor App plugin and only traverses router-owned history; the first entry consumes Back without exiting — protects the native app boundary while preserving router blockers.
- Navigation-only account checks share a short memory cache cleared by the root identity guard; role and membership queries retain immediate verification — removes duplicate network round trips without caching authorization decisions.
- The Android wrapper config is the committed capacitor.config.json: it loads the primary custom domain and allows navigation to every published host that redirects there — an unlisted redirect host makes Android open the system browser.
