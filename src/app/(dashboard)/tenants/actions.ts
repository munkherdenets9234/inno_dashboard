"use server";

import { revalidatePath } from "next/cache";
import { apiPut, ApiError } from "@/lib/api/client";
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
    cover_image: {
      url: String(formData.get("cover_image_url") ?? "").trim(),
      caption: String(formData.get("cover_image_caption") ?? "").trim(),
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
