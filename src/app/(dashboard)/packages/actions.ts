"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { LocaleList, LocaleText } from "@/lib/types";

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

// tenantcore's Plan carries the entitlement fields (modules/limits/
// capabilities/period_days) alongside the pricing-card content this app
// edits (see internal/models/billing.go's Plan.Marketing). This app only
// ever writes the marketing half; the entitlement fields are simply absent
// from the request body and left at whatever they already were (a partial
// PUT) or their zero value (a fresh plan with no module gate — the
// documented "unenforced" default).
//
// Plan.name (top level) is console-facing text, distinct from
// marketing.name (the bilingual public name) — see billing.go's comment on
// why the two are separate fields. This app has no console-only name field
// of its own, so it reuses the English marketing name, falling back to the
// slug, exactly like cmd/migrate-from-digitalservice's own planName() does.
function bodyFromForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const name = jsonField<LocaleText>(formData, "name") ?? {};
  return {
    slug,
    name: name.en || name.mn || slug,
    price: Number(formData.get("price") ?? 0),
    currency: String(formData.get("currency") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
    marketing: {
      name,
      tagline: jsonField<LocaleText>(formData, "tagline") ?? {},
      billing_note: jsonField<LocaleText>(formData, "billing_note") ?? {},
      features: jsonField<LocaleList>(formData, "features") ?? {},
      highlighted: formData.get("highlighted") === "on",
    },
  };
}

export async function createPackageAction(
  _prevState: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const token = await requireToken();
  const body = bodyFromForm(formData);
  if (!body.slug) return { error: "Slug is required." };
  if (!body.marketing.name.en) return { error: "Name (EN) is required." };

  try {
    await apiPost("/admin/plans", body, token);
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
    await apiPut(`/admin/plans/${id}`, body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save package." };
  }

  revalidatePath("/packages");
  revalidatePath(`/packages/${id}/edit`);
  return { saved: true };
}

export async function deletePackageAction(id: string) {
  const token = await requireToken();
  await apiDelete(`/admin/plans/${id}`, token);
  revalidatePath("/packages");
  redirect("/packages");
}
