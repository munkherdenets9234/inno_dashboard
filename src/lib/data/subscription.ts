import { apiGet, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { Subscription } from "@/lib/types";

// GET /admin/tenants/{id}/subscription. A tenant with no subscription is a
// normal state (a tenant created five minutes ago), not an error, so a 404
// becomes null and the page shows a Subscribe form. Anything else is a real
// failure and is rethrown, including the redirect thrown on an expired
// session, which is not an ApiError and so passes straight through.
export async function getTenantSubscription(tenantId: string): Promise<Subscription | null> {
  const token = await requireToken();
  try {
    return (await apiGet<Subscription>(`/admin/tenants/${tenantId}/subscription`, undefined, token)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// A plan as the Subscription page's picker needs it. Read from /admin/plans
// directly rather than through lib/data/packages: that reader translates Plan
// into the older Package shape, which drops period_days, and the page needs it
// to show the end date a choice WOULD produce before it is submitted.
export interface PlanOption {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  period_days: number;
}

// Only active plans: tenantcore refuses a subscription on an inactive one, so
// offering it would be offering a choice guaranteed to fail.
export async function listPlanOptions(): Promise<PlanOption[]> {
  const token = await requireToken();
  const res = await apiGet<Array<PlanOption & { is_active: boolean }> | null>(
    "/admin/plans",
    { page: 1, limit: 200 },
    token,
  );
  return (res.data ?? [])
    .filter((p) => p.is_active)
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, currency: p.currency, period_days: p.period_days }));
}
