// Server-only client for digitalservice's /platform/tenants/:id/admin-users
// routes. Those routes are guarded by the operator's own tenantcore Ed25519
// token (not digitalservice's login token), so callers pass requireToken().
// Same envelope handling as client.ts; the 401 rule differs (see dsRequest).

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

  // Deliberately unlike client.ts: no redirect on 401. If digitalservice's
  // TENANTCORE_PUBLIC_KEY is another tenantcore's, every valid token gets 401
  // here and a redirect would bounce the operator in a login loop.
  if (res.status === 401) {
    throw new ApiError(
      401,
      "digitalservice rejected the operator token. Check that its TENANTCORE_PUBLIC_KEY matches this tenantcore.",
    );
  }

  if (!res.ok || !json || !json.success) {
    throw new ApiError(res.status, json?.message ?? `Request to ${path} failed with status ${res.status}`);
  }
  return json.data as T;
}
