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
