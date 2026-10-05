import { apiGet } from "@/lib/api/client";
import type { Plan } from "@/lib/core-types";

// tenantcore's price list — what a tenant is charged for and what subscribing
// GRANTS. Not to be confused with lib/data/packages.ts, which is
// digitalservice's bilingual pricing cards.

export async function listPlans(token: string, page = 1, limit = 100) {
  const res = await apiGet<Plan[] | null>("/admin/plans", { page, limit }, token);
  return { ...res, data: res.data ?? [] };
}

export function getPlanById(id: string, token: string) {
  return apiGet<Plan>(`/admin/plans/${id}`, undefined, token);
}
