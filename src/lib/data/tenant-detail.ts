import { apiGet } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import { dsRequest, type ProductService } from "@/lib/api/digitalservice";
import { getTenantSubscription } from "@/lib/data/subscription";
import { productServiceFor } from "@/lib/product-service.mjs";
import { requireToken } from "@/lib/auth/session";
import type { ServiceClient, TenantAdminUser } from "@/lib/types";

// GET /admin/service-clients. An empty list may arrive as null.
export async function listServiceClients(): Promise<ServiceClient[]> {
  const token = await requireToken();
  const res = await apiGet<ServiceClient[] | null>("/admin/service-clients", undefined, token);
  return res.data ?? [];
}

// Which product service holds this tenant's admin accounts. The tenant's
// subscription plan lists its modules; a plan with 'realestate' routes to the
// real state service, anything else (including no subscription or a deleted
// plan) stays on digitalservice. Resolved on the server, never from the client.
export async function resolveTenantService(tenantId: string, token: string): Promise<ProductService> {
  const sub = await getTenantSubscription(tenantId);
  let modules: string[] = [];
  if (sub?.plan_id) {
    try {
      const res = await apiGet<{ modules?: string[] | null }>(`/admin/plans/${sub.plan_id}`, undefined, token);
      modules = res.data?.modules ?? [];
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) throw err;
    }
  }
  return productServiceFor(modules, {
    DIGITALSERVICE_URL: process.env.DIGITALSERVICE_URL,
    REALSTATE_SERVICE_URL: process.env.REALSTATE_SERVICE_URL,
  });
}

// service.baseUrl null means the product's URL is unset (the page shows
// "Not configured"); [] means the tenant has no admin users there.
export async function listTenantAdminUsers(tenantId: string, service: ProductService): Promise<TenantAdminUser[] | null> {
  if (!service.baseUrl) return null;
  const token = await requireToken();
  const data = await dsRequest<TenantAdminUser[] | null>(
    "GET",
    `/platform/tenants/${encodeURIComponent(tenantId)}/admin-users`,
    token,
    { service },
  );
  return data ?? [];
}
