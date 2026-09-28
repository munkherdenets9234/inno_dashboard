// Client for tenantcore's public showcase API (/public/* routes — see
// core_backend's internal/api/public). Every route this file calls needs no
// credential of any kind, not even a tenant API key — that's a deliberate,
// narrow exception to tenantcore's usual rule that everything requires one.
// Keep it that way: if a future need requires credentials, that belongs in
// the separate admin repo (inno_dashboard), not this public site.

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
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090/api/v1";
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

async function unwrap<T>(res: Response, path: string): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json || !json.success) {
    throw new ApiError(res.status, json?.message ?? `Request to ${path} failed with status ${res.status}`);
  }
  return { data: json.data as T, meta: json.meta };
}

export async function apiGet<T>(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined>,
): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const res = await fetch(`${baseUrl()}${path}${toQueryString(searchParams)}`, { cache: "no-store" });
  return unwrap<T>(res, path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res, path);
}
