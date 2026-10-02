import { apiGet } from "@/lib/api/client";
import { digitalserviceBaseUrl, dsRequest } from "@/lib/api/digitalservice";
import { requireToken } from "@/lib/auth/session";
import type { ServiceClient, TenantAdminUser } from "@/lib/types";

// GET /admin/service-clients. An empty list may arrive as null.
export async function listServiceClients(): Promise<ServiceClient[]> {
  const token = await requireToken();
  const res = await apiGet<ServiceClient[] | null>("/admin/service-clients", undefined, token);
  return res.data ?? [];
}

// null means DIGITALSERVICE_URL is unset (the page shows "Not configured");
// [] means the tenant has no admin users there.
export async function listTenantAdminUsers(tenantId: string): Promise<TenantAdminUser[] | null> {
  if (!digitalserviceBaseUrl()) return null;
  const token = await requireToken();
  const data = await dsRequest<TenantAdminUser[] | null>(
    "GET",
    `/platform/tenants/${encodeURIComponent(tenantId)}/admin-users`,
    token,
  );
  return data ?? [];
}
