import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { Quote } from "@/lib/types";

// The API returns `data: null` (not []) when a list is empty — coalesce so
// callers can always treat the result as an array.

// GET /admin/quotes requires the superadmin Bearer token on tenantcore —
// unlike digitalservice's old public /platform/quotes (a quote can be
// tenant-less, so there was no tenant to authenticate as there). tenantcore
// has no unauthenticated admin surface at all, so this moved behind the same
// gate as everything else in the console. See lib/data/tenants.ts for why
// fetching the token internally here is safe.
export async function listAllQuotes(page = 1, limit = 20) {
  const token = await requireToken();
  const res = await apiGet<Quote[] | null>("/admin/quotes", { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}

export async function listTenantQuotes(tenantId: string, page = 1, limit = 20) {
  const token = await requireToken();
  const res = await apiGet<Quote[] | null>(`/admin/tenants/${tenantId}/quotes`, { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}
