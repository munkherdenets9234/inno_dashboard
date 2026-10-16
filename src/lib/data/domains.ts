import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { TenantDomain } from "@/lib/types";

// GET /admin/tenants/{id}/domains. At most 50 per tenant, so no paging.
export async function listTenantDomains(tenantId: string): Promise<TenantDomain[]> {
  const token = await requireToken();
  const res = await apiGet<TenantDomain[] | null>(`/admin/tenants/${tenantId}/domains`, undefined, token);
  return res.data ?? [];
}
