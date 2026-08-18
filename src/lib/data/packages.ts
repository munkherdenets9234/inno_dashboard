import { apiGet } from "@/lib/api/client";
import type { Package } from "@/lib/types";

// GET /platform/packages, /platform/packages/{id}, and
// /platform/tenants/{id}/packages are all public reads — no Bearer token
// needed. Only create/update/delete/assign/unassign require one.
//
// The API returns `data: null` (not []) when a list is empty — coalesce so
// callers can always treat the result as an array.
export async function listPackages(page = 1, limit = 100) {
  const res = await apiGet<Package[] | null>("/platform/packages", { page, limit });
  return { ...res, data: res.data ?? [] };
}

export function getPackageById(id: string) {
  return apiGet<Package>(`/platform/packages/${id}`);
}

export async function listTenantPackages(tenantId: string, page = 1, limit = 100) {
  const res = await apiGet<Package[] | null>(`/platform/tenants/${tenantId}/packages`, { page, limit });
  return { ...res, data: res.data ?? [] };
}
