# One app, two faces

`innonomads/site` and `innonomads/admin` were merged on 2026-09-28. This repo
now serves both: the public marketing site at `/` and the operator's console
at `/admin`. `innonomads/site` is superseded — its code lives here.

```
src/app/
  layout.tsx          document, font, pre-paint theme script. Nothing else:
                      what belongs to only one half lives in that half.
  globals.css         the site's stylesheet (a superset of the console's,
                      with identical token values) + a dark pin for the console
  (site)/             the public site
    layout.tsx        Theme + Language + Content providers
    page.tsx  price/  our-projects/[slug]/  review/  contact/
  admin/
    login/            OUTSIDE the gate, or signing in would loop
    (console)/
      layout.tsx      the auth gate + AdminShell, for everything below it
      tenants/  quotes/  packages/  content/
src/components/
  site/               the public site's components, namespaced
  *.tsx               the console's
```

## Four things worth knowing before editing

**`components/site/` is namespaced for a reason.** `Button.tsx` and `Mark.tsx`
exist in both halves with different implementations. Merging them would be a
redesign, not a refactor.

**The console is pinned dark.** The public site can flip to a light theme and
stores that choice per browser. `[data-console]` in `globals.css` stops an
operator's earlier visit to the marketing site from following them into a
console that has never been designed light.

**Two API base URLs, and they are not interchangeable.**
`API_URL` is server-only and carries the superadmin token to tenantcore's
`/admin/*`. `NEXT_PUBLIC_API_URL` reaches the browser, because the contact
form posts from a client component — it is only ever used for tenantcore's
unauthenticated `/public/*` routes, and no credential is sent with it.

**The gate is a layout, not middleware.** `admin/(console)/layout.tsx`
redirects when there is no session cookie, and `lib/api/client.ts` redirects
when tenantcore rejects the token (a 401 on a request that carried one). The
cookie outlives the token deliberately; the second check is what makes the
mismatch self-healing. Note that `destroySession()` cannot be called from
that path — Next allows cookie writes only in Server Actions and Route
Handlers, not during a render.

## Where the content comes from

| On the page | Source |
|---|---|
| Pricing cards | tenantcore plans (`/public/plans`), edited under Packages |
| Case studies | tenantcore tenant details (`/public/projects`), edited under Tenants |
| Everything else — headlines, labels, FAQ | `src/lib/i18n/*.ts` as defaults, overridden by tenantcore (`/public/content`), edited under Site copy |

The dictionaries in `src/lib/i18n` stay the source of truth for what the site
*can* say; tenantcore holds only what an operator has changed. So an unedited
key renders its compiled-in default, a key added in code works with no content
migration, an unreachable tenantcore degrades to the wording that shipped with
the build, and clearing a field in the console reverts it rather than blanking
a live section.

## Retiring the old repo

A separate, deliberate step: point the public domain at this app, then archive
`innonomads/site`. Nothing here reads from it.
