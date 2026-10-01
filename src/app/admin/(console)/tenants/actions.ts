"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { LocaleText, ProjectImage, ProjectMetric } from "@/lib/types";

export interface TenantProjectFormState {
  error?: string;
  saved?: boolean;
}

function jsonField<T>(formData: FormData, name: string): T | undefined {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function updateTenantProjectAction(
  id: string,
  _prevState: TenantProjectFormState,
  formData: FormData,
): Promise<TenantProjectFormState> {
  const token = await requireToken();

  const body = {
    tagline: jsonField<LocaleText>(formData, "tagline") ?? {},
    description: jsonField<LocaleText>(formData, "description") ?? {},
    category: String(formData.get("category") ?? "").trim(),
    website_url: String(formData.get("website_url") ?? "").trim(),
    cover_image: {
      url: String(formData.get("cover_image_url") ?? "").trim(),
      caption: String(formData.get("cover_image_caption") ?? "").trim(),
    },
    admin_cover: {
      url: String(formData.get("admin_cover_url") ?? "").trim(),
      caption: String(formData.get("admin_cover_caption") ?? "").trim(),
    },
    images: jsonField<ProjectImage[]>(formData, "images") ?? [],
    metrics: jsonField<ProjectMetric[]>(formData, "metrics") ?? [],
    showcase: formData.get("showcase") === "on",
    featured: formData.get("featured") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
  };

  try {
    await apiPut(`/admin/tenants/${id}/project`, body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save." };
  }

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}/project`);
  return { saved: true };
}

export interface AssignPackageFormState {
  error?: string;
}

export async function assignPackageAction(
  tenantId: string,
  _prevState: AssignPackageFormState,
  formData: FormData,
): Promise<AssignPackageFormState> {
  const token = await requireToken();
  const packageId = String(formData.get("package_id") ?? "").trim();
  if (!packageId) return { error: "Choose a package to assign." };

  try {
    // package_id, not plan_id. tenantcore's assignment endpoint keeps the
    // console's own vocabulary ("package") on the wire, while its
    // subscription endpoints say plan_id — the two handlers disagree on
    // purpose, so this is not a typo to "tidy" into matching.
    await apiPost(`/admin/tenants/${tenantId}/packages`, { package_id: packageId }, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign package." };
  }

  revalidatePath(`/admin/tenants/${tenantId}/packages`);
  return {};
}

export async function unassignPackageAction(tenantId: string, packageId: string) {
  const token = await requireToken();
  await apiDelete(`/admin/tenants/${tenantId}/packages/${packageId}`, token);
  revalidatePath(`/admin/tenants/${tenantId}/packages`);
}

// ── Subscription ──────────────────────────────────────────────────────────
//
// These bind `plan_id`; assignPackageAction above binds `package_id`. tenantcore
// names them differently on purpose (subscriptions say plan, the package
// assignment keeps the console's own vocabulary), so do not unify them.
//
// All four share one signature, (tenantId, prevState, formData), so every
// outcome, including a 409 for renewing a cancelled subscription, reaches the
// page as a message through useActionState instead of throwing to an error
// boundary that redacts it in production.

export interface SubscriptionFormState {
  error?: string;
}

async function runSubscriptionAction(
  tenantId: string,
  call: (token: string) => Promise<unknown>,
  fallback: string,
): Promise<SubscriptionFormState> {
  const token = await requireToken();
  try {
    await call(token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : fallback };
  }
  revalidatePath(`/admin/tenants/${tenantId}/subscription`);
  return {};
}

function planIdOf(formData: FormData): string {
  return String(formData.get("plan_id") ?? "").trim();
}

export async function subscribeAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const planId = planIdOf(formData);
  if (!planId) return { error: "Choose a plan." };
  return runSubscriptionAction(
    tenantId,
    (token) => apiPost(`/admin/tenants/${tenantId}/subscription`, { plan_id: planId }, token),
    "Failed to create the subscription.",
  );
}

export async function changePlanAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const planId = planIdOf(formData);
  if (!planId) return { error: "Choose a plan." };
  return runSubscriptionAction(
    tenantId,
    (token) => apiPut(`/admin/tenants/${tenantId}/subscription/plan`, { plan_id: planId }, token),
    "Failed to change the plan.",
  );
}

// Renew and cancel take no input, so they are typed as the shared action shape
// and simply ignore the state and form data useActionState passes them.
type SubscriptionAction = (
  tenantId: string,
  prev: SubscriptionFormState,
  formData: FormData,
) => Promise<SubscriptionFormState>;

export const renewSubscriptionAction: SubscriptionAction = async (tenantId) => {
  return runSubscriptionAction(
    tenantId,
    (token) => apiPost(`/admin/tenants/${tenantId}/subscription/renew`, {}, token),
    "Failed to renew the subscription.",
  );
};

export const cancelSubscriptionAction: SubscriptionAction = async (tenantId) => {
  return runSubscriptionAction(
    tenantId,
    (token) => apiPost(`/admin/tenants/${tenantId}/subscription/cancel`, {}, token),
    "Failed to cancel the subscription.",
  );
};
