import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { Tenant } from "@/lib/types";

// GET /admin/tenants and /admin/tenants/{id} require the superadmin Bearer
// token on tenantcore — unlike digitalservice's old /platform/tenants, which
// was a public read. Every caller here already sits behind this app's own
// login gate ((dashboard)/layout.tsx), so fetching the token internally
// rather than threading it through every page component is safe and keeps
// the call sites unchanged from before this repoint.
//
// The API returns `data: null` (not []) when the list is empty — coalesce
// so callers can always treat the result as an array.
export async function listTenants(page = 1, limit = 50) {
  const token = await requireToken();
  const res = await apiGet<Tenant[] | null>("/admin/tenants", { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}

export async function getTenantById(id: string) {
  const token = await requireToken();
  return apiGet<Tenant>(`/admin/tenants/${id}`, undefined, token);
}
