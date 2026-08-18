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
    await apiPut(`/platform/tenants/${id}/project`, body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save." };
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}/project`);
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
    await apiPost(`/platform/tenants/${tenantId}/packages`, { package_id: packageId }, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign package." };
  }

  revalidatePath(`/tenants/${tenantId}/packages`);
  return {};
}

export async function unassignPackageAction(tenantId: string, packageId: string) {
  const token = await requireToken();
  await apiDelete(`/platform/tenants/${tenantId}/packages/${packageId}`, token);
  revalidatePath(`/tenants/${tenantId}/packages`);
}
