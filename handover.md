# innonomads/admin (core admin, Inno Nomads) — handover (2026-10-01)

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
