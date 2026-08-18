import { apiGet } from "@/lib/api/client";
import type { Tenant } from "@/lib/types";

// GET /platform/tenants and /platform/tenants/{id} are public reads — no
// auth needed — but this app is the only place that links to them, since
// they expose administrative fields (contact_email, api_key_last4, status).
//
// The API returns `data: null` (not []) when the list is empty — coalesce
// so callers can always treat the result as an array.
export async function listTenants(page = 1, limit = 50) {
  const res = await apiGet<Tenant[] | null>("/platform/tenants", { page, limit });
  return { ...res, data: res.data ?? [] };
}

export function getTenantById(id: string) {
  return apiGet<Tenant>(`/platform/tenants/${id}`);
}
