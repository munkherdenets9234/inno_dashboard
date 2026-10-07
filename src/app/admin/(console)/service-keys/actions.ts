"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";

// A raw service key exists only in the returned state (shown once by the page).
// It is never logged, stored, redirected with or put in a URL.

export interface CreateServiceKeyState {
  error?: string;
  newKey?: string;
  name?: string;
}

const MAX_NAME = 64;

export async function createServiceClientAction(
  _prev: CreateServiceKeyState,
  formData: FormData,
): Promise<CreateServiceKeyState> {
  const token = await requireToken();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter the product service's name." };
  if (name.length > MAX_NAME) return { error: `Name must be ${MAX_NAME} characters or fewer.` };

  let newKey: string;
  try {
    const res = await apiPost<{ service_key: string }>("/admin/service-clients", { name }, token);
    newKey = res.data.service_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create the service key." };
  }
  revalidatePath("/admin/service-keys");
  return { newKey, name };
}

export interface ServiceKeyActionState {
  error?: string;
  newKey?: string;
  done?: boolean;
}

export async function rotateServiceClientAction(id: string): Promise<ServiceKeyActionState> {
  const token = await requireToken();
  let newKey: string;
  try {
    const res = await apiPost<{ service_key: string }>(
      `/admin/service-clients/${encodeURIComponent(id)}/rotate`,
      {},
      token,
    );
    newKey = res.data.service_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to rotate the key." };
  }
  revalidatePath("/admin/service-keys");
  return { newKey };
}

export async function revokeServiceClientAction(id: string): Promise<ServiceKeyActionState> {
  const token = await requireToken();
  try {
    await apiPost(`/admin/service-clients/${encodeURIComponent(id)}/revoke`, {}, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to revoke the key." };
  }
  revalidatePath("/admin/service-keys");
  return { done: true };
}
