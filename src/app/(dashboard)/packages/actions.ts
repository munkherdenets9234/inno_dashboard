"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { LocaleList, LocaleText, Package } from "@/lib/types";

export interface PackageFormState {
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

function bodyFromForm(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: jsonField<LocaleText>(formData, "name") ?? {},
    tagline: jsonField<LocaleText>(formData, "tagline") ?? {},
    price: Number(formData.get("price") ?? 0),
    currency: String(formData.get("currency") ?? "").trim(),
    billing_note: jsonField<LocaleText>(formData, "billing_note") ?? {},
    features: jsonField<LocaleList>(formData, "features") ?? {},
    highlighted: formData.get("highlighted") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createPackageAction(
  _prevState: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const token = await requireToken();
  const body = bodyFromForm(formData);
  if (!body.slug) return { error: "Slug is required." };
  if (!body.name.en) return { error: "Name (EN) is required." };

  try {
    await apiPost<Package>("/platform/packages", body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create package." };
  }

  revalidatePath("/packages");
  redirect("/packages");
}

export async function updatePackageAction(
  id: string,
  _prevState: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const token = await requireToken();
  const body = bodyFromForm(formData);

  try {
    await apiPut<Package>(`/platform/packages/${id}`, body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save package." };
  }

  revalidatePath("/packages");
  revalidatePath(`/packages/${id}/edit`);
  return { saved: true };
}

export async function deletePackageAction(id: string) {
  const token = await requireToken();
  await apiDelete(`/platform/packages/${id}`, token);
  revalidatePath("/packages");
  redirect("/packages");
}
