import { apiGet } from "@/lib/api/client";
import type { Quote } from "@/lib/types";

// GET /platform/quotes is fully public (a quote can be tenant-less, so
// there's no tenant to authenticate as) — no Bearer token needed.
export function listAllQuotes(page = 1, limit = 20) {
  return apiGet<Quote[]>("/platform/quotes", { page, limit });
}

// GET /platform/tenants/{id}/quotes is superadmin-only — needs the Bearer
// token, unlike the platform-wide list above.
export function listTenantQuotes(tenantId: string, page = 1, limit = 20, token?: string) {
  return apiGet<Quote[]>(`/platform/tenants/${tenantId}/quotes`, { page, limit }, token);
}
