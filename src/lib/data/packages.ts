import { apiGet } from "@/lib/api/client";
import type { Package } from "@/lib/types";

// GET /platform/packages, /platform/packages/{id}, and
// /platform/tenants/{id}/packages are all public reads — no Bearer token
// needed. Only create/update/delete/assign/unassign require one.
export function listPackages(page = 1, limit = 100) {
  return apiGet<Package[]>("/platform/packages", { page, limit });
}

export function getPackageById(id: string) {
  return apiGet<Package>(`/platform/packages/${id}`);
}

export function listTenantPackages(tenantId: string, page = 1, limit = 100) {
  return apiGet<Package[]>(`/platform/tenants/${tenantId}/packages`, { page, limit });
}
