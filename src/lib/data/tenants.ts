import { apiGet } from "@/lib/api/client";
import type { Tenant } from "@/lib/types";

// GET /platform/tenants and /platform/tenants/{id} are public reads — no
// auth needed — but this app is the only place that links to them, since
// they expose administrative fields (contact_email, api_key_last4, status).
export function listTenants(page = 1, limit = 50) {
  return apiGet<Tenant[]>("/platform/tenants", { page, limit });
}

export function getTenantById(id: string) {
  return apiGet<Tenant>(`/platform/tenants/${id}`);
}
