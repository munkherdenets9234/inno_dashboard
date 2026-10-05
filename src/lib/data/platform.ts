import { apiGet } from "@/lib/api/client";
import type { PlatformUser, ServiceClient } from "@/lib/core-types";

// The operator's own staff, and the product services allowed to ask
// tenantcore about entitlements.

// Returns the whole list — tenantcore does not paginate this one, because the
// number of product services is small by construction.
export async function listServiceClients(token: string) {
  const res = await apiGet<ServiceClient[] | null>("/admin/service-clients", undefined, token);
  return { ...res, data: res.data ?? [] };
}

export async function listStaff(token: string, page = 1, limit = 50) {
  const res = await apiGet<PlatformUser[] | null>("/admin/admins", { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}
