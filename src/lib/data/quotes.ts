import { apiGet } from "@/lib/api/client";
import type { Quote } from "@/lib/types";

// The API returns `data: null` (not []) when a list is empty — coalesce so
// callers can always treat the result as an array.

// GET /platform/quotes is fully public (a quote can be tenant-less, so
// there's no tenant to authenticate as) — no Bearer token needed.
export async function listAllQuotes(page = 1, limit = 20) {
  const res = await apiGet<Quote[] | null>("/platform/quotes", { page, limit });
  return { ...res, data: res.data ?? [] };
}

// GET /platform/tenants/{id}/quotes is superadmin-only — needs the Bearer
// token, unlike the platform-wide list above.
export async function listTenantQuotes(tenantId: string, page = 1, limit = 20, token?: string) {
  const res = await apiGet<Quote[] | null>(`/platform/tenants/${tenantId}/quotes`, { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}
