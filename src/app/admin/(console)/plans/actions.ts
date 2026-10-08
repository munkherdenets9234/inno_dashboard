"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { Plan } from "@/lib/core-types";
import type { PlanFormState } from "@/lib/form-state";

// Plans are tenantcore's — the billing tier and what subscribing GRANTS.
// digitalservice's packages (the bilingual pricing cards) are edited under
// /packages and have nothing to do with these.

// Modules and capabilities are comma-separated; limits are `key = number`,
// one per line. Free text rather than a key/value widget because these keys
// are defined by the PRODUCT, not by this console — there is no list to pick
// from, and pretending there is one would go stale the first time a product
// adds a limit.
function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLimits(raw: string): { limits: Record<string, number> } | { error: string } {
  const limits: Record<string, number> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return { error: `Limits: "${trimmed}" is not in the form "key = number".` };
    const key = trimmed.slice(0, eq).trim();
    const value = Number(trimmed.slice(eq + 1).trim());
    if (!key) return { error: `Limits: a line is missing its key.` };
    if (!Number.isInteger(value) || value < 0) {
      return { error: `Limits: "${key}" must be a whole number of zero or more.` };
    }
    limits[key] = value;
  }
  return { limits };
}

// An absent capability key is OFF, so only the enabled ones are stored. A map
// full of `false` would say the same thing in more bytes and invite someone
// to read a missing key as "unset" rather than "off".
function parseCapabilities(raw: string): Record<string, boolean> {
  const caps: Record<string, boolean> = {};
  for (const name of parseList(raw)) caps[name] = true;
  return caps;
}

type PlanBody = Pick<
  Plan,
  | "slug"
  | "name"
  | "price"
  | "currency"
  | "period_days"
  | "modules"
  | "limits"
  | "capabilities"
  | "is_active"
  | "sort_order"
>;

function readForm(formData: FormData): { body: PlanBody } | { error: string } {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!slug || !name) return { error: "Slug and name are required." };

  const price = Number(formData.get("price") ?? 0);
  if (!Number.isFinite(price) || price < 0) return { error: "Price cannot be negative." };

  const periodDays = Number(formData.get("period_days") ?? 30);
  if (!Number.isInteger(periodDays) || periodDays < 1) {
    return { error: "Billing period must be a whole number of days, at least 1." };
  }

  const modules = parseList(String(formData.get("modules") ?? ""));
  if (new Set(modules).size !== modules.length) return { error: "Duplicate module name." };

  const parsed = parseLimits(String(formData.get("limits") ?? ""));
  if ("error" in parsed) return { error: parsed.error };

  return {
    body: {
      slug,
      name,
      price,
      currency: String(formData.get("currency") ?? "MNT").trim() || "MNT",
      period_days: periodDays,
      modules,
      limits: parsed.limits,
      capabilities: parseCapabilities(String(formData.get("capabilities") ?? "")),
      is_active: formData.get("is_active") === "on",
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    },
  };
}

export async function createPlanAction(
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const token = await requireToken();
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await apiPost<Plan>("/admin/plans", parsed.body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create plan." };
  }

  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function updatePlanAction(
  id: string,
  _prevState: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const token = await requireToken();
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  // tenantcore takes a partial document and $sets exactly the keys sent. The
  // form edits every one of them, so sending the whole set is honest — but a
  // key omitted here is LEFT ALONE, not cleared, which is why clearing
  // modules means sending [] rather than dropping the field.
  try {
    await apiPut(`/admin/plans/${id}`, parsed.body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to save plan." };
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}/edit`);
  redirect("/admin/plans");
}

// Deleting a plan does NOT cancel the subscriptions on it. tenantcore leaves
// them pointing at a plan that no longer exists, reports the subscription
// with a null plan, and assembles an entitlement with NO modules and NO
// limits.
//
// That reads like a downgrade and is the opposite: an empty module list means
// the module gate is not enforced, and an absent limit means unlimited. So
// deleting a plan quietly gives everyone on it the run of every product. The
// confirmation in the UI says exactly that, which is why it is worded more
// strongly than a delete usually would be.
export async function deletePlanAction(id: string) {
  const token = await requireToken();
  await apiDelete(`/admin/plans/${id}`, token);
  revalidatePath("/admin/plans");
}
