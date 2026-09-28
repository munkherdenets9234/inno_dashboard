// Server-only client for tenantcore's console API (/admin/...). Every route
// under /admin requires a superadmin Bearer token (see lib/auth/session.ts) —
// unlike digitalservice's old /platform/* surface, tenantcore has no
// unauthenticated admin reads. There is no X-API-Key anywhere in this app —
// that header identifies a tenant, and this app only ever operates across
// tenants, never as one.

import { redirect } from "next/navigation";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: { total: number; page: number; limit: number };
  message?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function baseUrl() {
  return process.env.API_URL ?? "http://localhost:8090/api/v1";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers, cache: "no-store" });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  // A 401 on a request we DID send a token with means the token is dead —
  // tenantcore's tokens are verified offline and expire on their own
  // (TOKEN_TTL), while this app's cookie outlives them. Without this the
  // console sits in a state that looks signed in and answers every page with
  // "API error (401)", and the only way out is finding the log-out button.
  //
  // Only when a token was sent: a 401 from the login call itself means the
  // password was wrong, and redirecting there would be a loop.
  if (res.status === 401 && token) {
    // Redirect only — the cookie is NOT cleared here. Next allows cookie
    // writes in Server Actions and Route Handlers, not during a render, and
    // this runs inside one. Trying to delete it throws before the redirect
    // is ever reached, which is how this first shipped and why every page
    // said "Something went wrong" instead of sending the user anywhere.
    //
    // Leaving the dead cookie in place is harmless: every guarded page ends
    // up here and bounces, and signing in overwrites it.
    redirect("/admin/login");
  }

  if (!res.ok || !json || !json.success) {
    throw new ApiError(res.status, json?.message ?? `Request to ${path} failed with status ${res.status}`);
  }

  return { data: json.data as T, meta: json.meta };
}

function toQueryString(searchParams?: Record<string, string | number | boolean | undefined>) {
  if (!searchParams) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function apiGet<T>(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined>,
  token?: string,
) {
  return request<T>(`${path}${toQueryString(searchParams)}`, { method: "GET" }, token);
}

export function apiPost<T>(path: string, body: unknown, token?: string) {
  return request<T>(
    path,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    token,
  );
}

export function apiPut<T>(path: string, body: unknown, token?: string) {
  return request<T>(
    path,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    token,
  );
}

export function apiDelete<T>(path: string, token?: string) {
  return request<T>(path, { method: "DELETE" }, token);
}
