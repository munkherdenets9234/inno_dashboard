"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { apiPost, apiPut, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { CreatedServiceClient } from "@/lib/core-types";
import type { PlatformFormState } from "@/lib/form-state";

// The platform's own accounts and the product services allowed to ask it
// about entitlements. Both are tenantcore's alone — digitalservice has no say
// in either since the cutover.

// ── Service clients ───────────────────────────────────────────────────────

export async function createServiceClientAction(
  _prevState: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const token = await requireToken();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required — use the service's own name, e.g. carwash." };

  let created: CreatedServiceClient;
  try {
    created = (await apiPost<CreatedServiceClient>("/admin/service-clients", { name }, token)).data;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create service client." };
  }

  revalidatePath("/admin/platform/service-clients");
  // Same one-shot secret handling as a tenant's API key: it goes in that
  // service's TENANTCORE_SERVICE_KEY now or not at all.
  redirect(`/admin/platform/service-clients?new_key=${encodeURIComponent(created.service_key)}`);
}

// Revoking is a status change, not a delete, so the record of which service
// held which key survives — which is what an incident review needs.
export async function revokeServiceClientAction(id: string) {
  const token = await requireToken();
  await apiPost(`/admin/service-clients/${id}/revoke`, {}, token);
  revalidatePath("/admin/platform/service-clients");
}

// ── Platform staff ────────────────────────────────────────────────────────

export async function createStaffAction(
  _prevState: PlatformFormState,
  formData: FormData,
): Promise<PlatformFormState> {
  const token = await requireToken();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const password = String(formData.get("password") ?? "");
  let generated: string | undefined;
  try {
    const { data } = await apiPost<{ password?: string }>(
      "/admin/admins",
      { name: String(formData.get("name") ?? "").trim(), email, password },
      token,
    );
    generated = data.password;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create staff account." };
  }

  revalidatePath("/admin/platform/staff");
  // tenantcore generates a password when none was given, and echoes it once.
  // When one WAS given, there is nothing to show — whoever typed it has it.
  if (generated) redirect(`/admin/platform/staff?new_password=${encodeURIComponent(generated)}`);
  redirect("/admin/platform/staff");
}

// tenantcore refuses to suspend the LAST active platform user — locking every
// administrator out of the service that administers every tenant is not
// undoable through the API. That refusal is an expected answer here, not a
// crash, so it comes back on the URL rather than through the error boundary.
export async function updateStaffStatusAction(id: string, status: "active" | "suspended") {
  const token = await requireToken();
  try {
    await apiPut(`/admin/admins/${id}/status`, { status }, token);
  } catch (err) {
    unstable_rethrow(err);
    const message = err instanceof ApiError ? err.message : "Failed to update the account.";
    redirect(`/admin/platform/staff?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/platform/staff");
  redirect("/admin/platform/staff");
}

// Suspension does not bite until the user's current token expires, because
// tokens are verified offline by every product. TOKEN_TTL is that window.
export async function resetStaffPasswordAction(id: string) {
  const token = await requireToken();
  const { data } = await apiPut<{ password?: string }>(
    `/admin/admins/${id}/password`,
    { new_password: "" },
    token,
  );
  revalidatePath("/admin/platform/staff");
  if (data.password) redirect(`/admin/platform/staff?new_password=${encodeURIComponent(data.password)}`);
  redirect("/admin/platform/staff");
}
