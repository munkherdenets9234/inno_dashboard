# innonomads/admin (core admin, Inno Nomads) — handover (2026-10-01)

## Update 2026-10-03 — tenant detail page (latest)

- **Built and committed, local only:** `/admin/tenants/[id]` (tenant API key last 4 + rotate, product service keys + rotate, tenant admin accounts + password reset). Console commits `320e25a`, `f3f2392`, `40daba2`, `d8f3413` on `backend-update`. Backends: tenantcore `c502532`, `151e058` (service-key rotate, `POST /admin/service-clients/{id}/rotate`); digitalservice `f1890e0`, `8aad321`, `711686a` (verifies tenantcore's Ed25519 public key on `GET/POST /platform/tenants/:id/admin-users…`). Spec/plan: `tenantcore/docs/superpowers/{specs,plans}/2026-10-02-tenant-detail-page*` (untracked). SDD ledger: `tenantcore/.superpowers/sdd/2026-10-02-tenant-detail-page/progress.md`.
- **New env:** console `DIGITALSERVICE_URL` (includes `/api/v1`; unset = "Not configured"); digitalservice `TENANTCORE_PUBLIC_KEY` (tenantcore's `/.well-known/tenantcore` `public_key`; unset = group answers 404). Both were appended to the local `.env.local` / `.env` on 2026-10-03.
- **Verified live (read-only):** page renders for `ZZ-THROWAWAY console test`, last4 shows, service-key table lists active/revoked, admin-users call passes through the tenantcore-token → digitalservice chain (empty list, no auth error), group answers 401 without a token. Go checks green in both services; `tsc`/eslint clean on touched console files.
- **NOT verified live (user chose to stop; writes to the shared Atlas DB were blocked):** tenant API key rotate, service-key rotate, admin password reset end to end, staff/suspended refusals. Needs throwaway rows in a DB that is not the shared one, or the user clicking. Never rotate `digitalservice-local` / `carwash-local` (in use).
- **Deviations / deferred:** digitalservice 401 shows a message (key mismatch), not a login redirect; `exp` claim not required by either verifier; no test fails if the reset route's rate limiter is removed; revealed one-time key can vanish if the list refetch fails; verifier ignores `kid`.
- Also seen: tenantcore has commits `b65cfd6`, `c7ad318`, `fb43235` (Brevo HTTPS mail, dev Gmail fallback) not from this work; `/readyz` showed `email` enabled on 2026-10-03.

## Update 2026-10-02 (supersedes "uncommitted" below)

- Branch `backend-update`, clean, 6 commits unpushed. **The Subscription page is committed: `5318fbe`** (Plan A Task 8). Start it with `npm run dev -- -p 3011` from this folder (the launch config's `--prefix` form misbehaves for the site; this app worked from its folder).
- **Click-through on 2026-10-02 against `ZZ-THROWAWAY console test` (id `6abddd74a3edc529920a78ab`), all matching the previews on the page:** billing day change (current period unchanged, previews moved), Renew (end date moved to the next billing day as previewed), Change plan to Travel Pro (new period from today, as previewed), Cancel confirmation (Keep it closes it). **Not tested:** the cancel itself on the throwaway (the click was blocked by the session's permission check), reactivate-by-change-plan, Subscribe on a tenant with none, the deleted-plan ("Plan removed") case.
- The user cancelled **Nelson Travel** and **Bayan Bogd** from this page; both read CANCELED, cancelled 2026-10-02. The tenants list's "ACTIVE" column is the tenant status, a separate field.
- The throwaway tenant now reads **Travel Pro, active, billing day 10, ends 2026-11-10** (it was Starter, day 15, ends 2026-11-15). Delete it when done (never delete a tenant whose name does not start with `ZZ-THROWAWAY`).
- **Password reset 404 on production:** see below; the dashboard's server-side `API_URL` must end in `/api/v1`. Code path: `src/app/admin/forgot-password/actions.ts` -> `apiPost` in `src/lib/api/client.ts` (`API_URL`, server only; default `http://localhost:8090/api/v1`).
- Console sessions end whenever tenantcore restarts (tokens last 1 h).

- **Ports / how to start (2026-10-02):** tenantcore :8092, digitalservice :8080, travel admin :3001, inno dashboard :3011, carwash :8091, carwash-web :3002. The launch-config entry `eandstravelmongolia` serves 404 on every page (its `npm --prefix` form starts Next from the repo root): start the E&S site with `npm run dev -- -p 3000` from `eandstravelmongolia/`. Port 3000 may be another project; check the page title.
- **Pushing is blocked from this machine:** GitHub answers `Permission denied (publickey)` for `~/.ssh/id_ed25519`. Nothing from the 2026-10-01/02 sessions was pushed except what the user pushed themselves (tenantcore `backend-update` was merged as PR #1). Unpushed at last check: digitalservice 13, E&S site 7, travel admin 6, inno admin 6, inno site 1, carwash 1, carwash-web 1.
- **Production tenantcore** is `https://core-backend-5cjs.onrender.com`. Checked 2026-10-02: `/healthz` and `/readyz` 200, public API 200, admin routes 401 without a token, `POST /api/v1/admin/password-reset/request` is registered but answers **503** because `GMAIL_EMAIL`/`GMAIL_PASSWORD` are not set on Render (`/readyz` is `degraded`; `email` and `expiry_notice` are off). Set a Google **App Password** (16 lowercase letters) there, and `EXPIRY_NOTICE_EMAIL`.
- **Inno dashboard production 404 on password reset:** `POST <host>/admin/password-reset/request` (no `/api/v1`) is 404 on production, which is exactly the dashboard's error. The dashboard's server-side `API_URL` on Vercel must be `https://core-backend-5cjs.onrender.com/api/v1` (and `NEXT_PUBLIC_API_URL` the same); redeploy after changing. Not confirmed: the Vercel settings could not be seen.
- **Cancelled on 2026-10-02 (by the user, in tenantcore):** Nelson Travel and Bayan Bogd (Bayan Bogd is the tenant behind carwash/carwash-web). E&S Discovery Mongolia is still active and its subscription **ends 2026-10-20**: after that its writes (including saving translations) return 402 until renewed. Plan question still open: E&S is on `starter`, the assistant had set `travel-pro`; ask the user, change nothing unasked.
- **Credentials:** the user typed a password in chat for sign-in during the session. It is stored nowhere. Suggest changing it. Never print `.env`.

Work was **paused with uncommitted changes** because the session context was filling. The uncommitted part is the **Subscription page**, which passes typecheck and lint but has **never been clicked through**, because that needs the user to sign in and they had not yet.

- Branch: `backend-update`. Last commit: `be72112 feat: add a forgot-password page to the core admin`. Nothing is pushed.
- Committed this session (newest first): `be72112` forgot-password page, `babef1a` billing-day date helpers/actions, `1e5c8e7` subscription data layer and actions, `3f07f92` assign-package fix.
- **Uncommitted** (this is Plan A's Task 8):
  - `src/app/admin/(console)/tenants/[id]/subscription/page.tsx` — new
  - `src/components/SubscriptionPanel.tsx` — new
  - `src/app/admin/(console)/tenants/page.tsx` — adds a "Subscription" link per tenant
  - `src/lib/data/subscription.ts` — adds `listPlanOptions()` (reads `/admin/plans` directly because the older `Package` shape drops `period_days`)
- Checks: `npx tsc --noEmit` exit 0. `npx eslint` on the files touched is clean. **`npx eslint src` is NOT clean**: 3 errors in untouched files (`(site)/error.tsx`, `LanguageProvider.tsx`, `ThemeProvider.tsx`) come from the site merge. I proved they exist without my changes by stashing; leave them to whoever owns that merge.

## What this app is
The single app for both the public Inno Nomads site (`/`) and the superadmin console (`/admin`), Next.js 16 on **:3011** (launch config `innonomads-admin`). It talks only to **tenantcore** (`API_URL`, server-side; `NEXT_PUBLIC_API_URL` is for the browser and `/public/*` only). Read `STRUCTURE.md` and `CUTOVER.md` here for the layout and the cutover story. `AGENTS.md` warns that this Next has breaking changes; copy existing patterns.

## Plan A (subscription management + expiry notice) — this app's part
Spec/plan: `tenantcore/docs/superpowers/specs/2026-10-01-subscription-expiry-notice-design.md` and `.../plans/2026-10-01-subscription-expiry-notice.md`. Ledger: `tenantcore/.superpowers/sdd/2026-10-01-subscription-expiry-notice/progress.md` (gitignored, this machine only).

- Task 7 (data layer + actions + helpers): committed.
- **Task 8 (the page): written, unverified, uncommitted.** What it should do: show plan / status / period / days left / billing day; **Renew** (previews the resulting end date); **Billing day** (1–28, saving changes future periods only, never the current end); **Change plan** (previews the end date and warns that it replaces the period and discards remaining days); **Cancel** (needs confirmation; Change plan can reactivate it); Subscribe when there is none. A cancelled subscription hides Renew. A deleted plan must render as "Plan removed" without crashing.
- **Why it is unverified:** the console session expires whenever tenantcore restarts (1h tokens), and signing in means typing the superadmin password, which the assistant must not do. **Ask the user to sign in at `http://localhost:3011/admin/login`.**
- Click-through target: throwaway tenant `ZZ-THROWAWAY console test`, id `6abddd74a3edc529920a78ab` (page: `/admin/tenants/6abddd74a3edc529920a78ab/subscription`). It has a `starter` subscription, billing day 15, ending 2026-11-15. Exercise Subscribe/Renew/Billing day/Change plan/Cancel/Reactivate, plus a deleted-plan case (create a throwaway plan, subscribe, delete the plan). A typecheck cannot catch a wrong wire field, so every action must be used once. **Then delete the throwaway tenant** and commit: `feat: add the Subscription page to the core admin`.
- The date helpers in `src/lib/subscription.ts` mirror tenantcore's `billingAlignedEnd`, `renewedEnd`, `daysLeft`. If tenantcore's rule changes, change them together. They were scratch-checked in node against the Go test table and live API results; the console has no test runner.

## Forgot-password page (committed)
`/admin/forgot-password` (public, outside the `(console)` group, like `/admin/login`) drives tenantcore's `POST /admin/password-reset/request|confirm`; the login page is a server page plus a `LoginForm` client component so it can read `?reset=1`. Tested in the browser: unknown address, mismatched passwords, wrong code, no stale error after "start over", and the banner. **A completed reset was not tested** because it would change the real superadmin password (`munkherdene@bdsec.mn`). The user was going to finish one themselves; unconfirmed.

## Gotchas
- `Assign package` sends `package_id`; subscription routes send `plan_id`. tenantcore's handlers disagree **on purpose**. Don't unify them. (Fixing this was `3f07f92`; the page also read `{plan_ids}` when the route returns `Plan[]`, which failed silently.)
- A 401 on a request that carried a token redirects to `/admin/login` (`lib/api/client.ts`). The reset actions carry no token, so a wrong code stays on the page.
- tenantcore sends `null`, not `[]`, for empty collections; types must admit it.
- Windows shell: put long Python in a file; a command moved to the background keeps running its later steps.
- Never print `.env` values.
