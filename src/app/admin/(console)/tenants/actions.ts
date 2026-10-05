"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api/client";
import { dsRequest } from "@/lib/api/digitalservice";
import { requireToken } from "@/lib/auth/session";
import type { CreatedTenant } from "@/lib/core-types";
import type { CreateTenantState, TenantIdentityState } from "@/lib/form-state";
import { validBillingDay } from "@/lib/subscription";
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

  // Optional: left out, tenantcore applies the default (the 20th).
  const rawDay = String(formData.get("billing_day") ?? "").trim();
  const billingDay = rawDay === "" ? undefined : Number(rawDay);
  if (billingDay !== undefined && !validBillingDay(billingDay)) {
    return { error: "Billing day must be a whole number from 1 to 28." };
  }

  return runSubscriptionAction(
    tenantId,
    (token) =>
      apiPost(
        `/admin/tenants/${tenantId}/subscription`,
        billingDay === undefined ? { plan_id: planId } : { plan_id: planId, billing_day: billingDay },
        token,
      ),
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

// Changes the day future periods end on. Never moves the current period end:
// moving it earlier would silently take days the tenant already paid for, and
// Renew is how the current end moves.
export async function setBillingDayAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const day = Number(String(formData.get("billing_day") ?? "").trim());
  if (!validBillingDay(day)) return { error: "Billing day must be a whole number from 1 to 28." };
  return runSubscriptionAction(
    tenantId,
    (token) => apiPut(`/admin/tenants/${tenantId}/subscription/billing-day`, { billing_day: day }, token),
    "Failed to change the billing day.",
  );
}

// ── Detail page: key rotation and admin password reset ────────────────────
//
// A raw key exists only in the returned state (shown once by the page). It is
// never logged, stored, redirected with or put in a URL.

export interface RotateKeyState {
  error?: string;
  newKey?: string;
}

export async function rotateTenantKeyAction(
  tenantId: string,
): Promise<RotateKeyState> {
  const token = await requireToken();
  let newKey: string;
  try {
    const res = await apiPost<{ api_key: string }>(`/admin/tenants/${tenantId}/rotate-key`, {}, token);
    newKey = res.data.api_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to rotate the key." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { newKey };
}

export async function rotateServiceKeyAction(
  serviceClientId: string,
  tenantId: string,
): Promise<RotateKeyState> {
  const token = await requireToken();
  let newKey: string;
  try {
    const res = await apiPost<{ service_key: string }>(
      `/admin/service-clients/${serviceClientId}/rotate`,
      {},
      token,
    );
    newKey = res.data.service_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to rotate the key." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { newKey };
}

export interface ResetPasswordState {
  error?: string;
  sent?: boolean;
}

export async function resetAdminPasswordAction(
  tenantId: string,
  userId: string,
): Promise<ResetPasswordState> {
  const token = await requireToken();
  try {
    await dsRequest(
      "POST",
      `/platform/tenants/${encodeURIComponent(tenantId)}/admin-users/${encodeURIComponent(userId)}/reset-password`,
      token,
    );
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiError) {
      if (err.status === 503) return { error: "Email isn't set up on this server" };
      return { error: err.message };
    }
    return { error: "Failed to send the reset code." };
  }
  return { sent: true };
}

// ── Tenant create, status and domain ──────────────────────────────────────

export async function createTenantAction(
  _prevState: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  const token = await requireToken();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) return { error: "Name and slug are required." };

  let created: CreatedTenant;
  try {
    const res = await apiPost<CreatedTenant>(
      "/admin/tenants",
      {
        name,
        slug,
        contact_email: String(formData.get("contact_email") ?? "").trim(),
        domain: String(formData.get("domain") ?? "").trim(),
      },
      token,
    );
    created = res.data;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create tenant." };
  }

  revalidatePath("/admin/tenants");
  // The API key is returned exactly once and cannot be read back. Carrying it
  // to the detail page in the URL is deliberate: this is a secret the
  // operator MUST copy now, and a redirect that dropped it would mean
  // rotating a key nobody ever used.
  redirect(`/admin/tenants/${created.tenant.id}?new_key=${encodeURIComponent(created.api_key)}`);
}

// Suspension outranks the billing state: a suspended tenant's entitlement
// reads "canceled" to every product on its next lookup, whatever the
// subscription says. Reactivating hands the decision back to billing.
export async function updateTenantStatusAction(id: string, status: "active" | "suspended") {
  const token = await requireToken();
  await apiPut(`/admin/tenants/${id}/status`, { status }, token);
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
}

export async function updateTenantDomainAction(
  id: string,
  _prevState: TenantIdentityState,
  formData: FormData,
): Promise<TenantIdentityState> {
  const token = await requireToken();
  try {
    await apiPut(
      `/admin/tenants/${id}/domain`,
      { domain: String(formData.get("domain") ?? "").trim() },
      token,
    );
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to update domain." };
  }
  revalidatePath(`/admin/tenants/${id}`);
  return { saved: true };
}
