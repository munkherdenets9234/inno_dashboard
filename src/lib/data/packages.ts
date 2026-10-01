import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { LocaleList, LocaleText, Package } from "@/lib/types";

// tenantcore's admin Plan — see internal/api/view.Plan / PlanMarketing. This
// app only ever edits the public pricing-card copy, never the entitlement
// fields (modules/limits/capabilities/period_days) also present on a plan —
// those stay untouched by whatever this app writes back.
interface PlanResponse {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  marketing?: {
    name?: LocaleText;
    tagline?: LocaleText;
    billing_note?: LocaleText;
    features?: LocaleList;
    highlighted?: boolean;
  };
}

// toPackage translates tenantcore's Plan (entitlement + marketing, in one
// document) down to the Package shape this app has always worked with (pure
// pricing-card content) — the same translation inno_frontend does on its own
// public read, so both apps keep the interface they had before this repoint.
function toPackage(p: PlanResponse): Package {
  const m = p.marketing;
  return {
    id: p.id,
    slug: p.slug,
    name: m?.name ?? {},
    tagline: m?.tagline ?? {},
    price: p.price,
    currency: p.currency,
    billing_note: m?.billing_note ?? {},
    features: m?.features ?? {},
    highlighted: m?.highlighted ?? false,
    sort_order: p.sort_order,
    is_active: p.is_active,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

// GET /admin/plans requires the superadmin Bearer token on tenantcore —
// unlike digitalservice's old public /platform/packages. See lib/data/tenants.ts
// for why fetching it internally here is safe.
//
// The API returns `data: null` (not []) when the list is empty — coalesce so
// callers can always treat the result as an array.
export async function listPackages(page = 1, limit = 100) {
  const token = await requireToken();
  const res = await apiGet<PlanResponse[] | null>("/admin/plans", { page, limit }, token);
  return { ...res, data: (res.data ?? []).map(toPackage) };
}

export async function getPackageById(id: string) {
  const token = await requireToken();
  const res = await apiGet<PlanResponse>(`/admin/plans/${id}`, undefined, token);
  return { ...res, data: toPackage(res.data) };
}

// tenantcore's tenant-package route returns the assigned plans as full Plan
// documents (docs/api.json: "Which pricing cards a tenant displays"), so the
// response is used as-is.
//
// This used to read `{ plan_ids }` and resolve them against the full list.
// That shape never existed on the wire, and the failure was silent:
// `new Set(undefined)` is an empty set, so the page said nothing was assigned
// even immediately after a successful assign.
export async function listTenantPackages(tenantId: string) {
  const token = await requireToken();
  const res = await apiGet<PlanResponse[] | null>(`/admin/tenants/${tenantId}/packages`, undefined, token);
  // The API serialises an empty result as null, not [].
  return { ...res, data: (res.data ?? []).map(toPackage) };
}
