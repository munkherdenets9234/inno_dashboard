// Server-only client for digitalservice's /platform/tenants/:id/admin-users
// routes. Those routes are guarded by the operator's own tenantcore Ed25519
// token (not digitalservice's login token), so callers pass requireToken().
// Same envelope handling and 401 rule as client.ts.

import { redirect } from "next/navigation";
import { ApiError, type ApiEnvelope } from "./client";

// No default: an unset URL means "not configured" and callers skip the call.
export function digitalserviceBaseUrl(): string | null {
  const url = process.env.DIGITALSERVICE_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

export async function dsRequest<T>(
  method: "GET" | "POST",
  path: string,
  token: string,
): Promise<T> {
  const base = digitalserviceBaseUrl();
  if (!base) throw new ApiError(503, "DIGITALSERVICE_URL is not set");

  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  // A token was sent, so a 401 means it is dead. Redirect only; cookies
  // cannot be written during a render (see client.ts).
  if (res.status === 401) redirect("/admin/login");

  if (!res.ok || !json || !json.success) {
    throw new ApiError(res.status, json?.message ?? `Request to ${path} failed with status ${res.status}`);
  }
  return json.data as T;
}
