// Server-only client for digitalservice's platform-level API
// (/platform/...). Reads need no auth at all; writes take a superadmin
// Bearer token (see lib/auth/session.ts). There is no X-API-Key anywhere in
// this app — that header identifies a tenant, and this app only ever
// operates across tenants, never as one.

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
  return process.env.API_URL ?? "http://localhost:8080/api/v1";
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
