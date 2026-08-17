import { ApiError } from "./client";

export type SafeResult<T> = { ok: true; data: T } | { ok: false; message: string };

export function apiErrorMessage(err: unknown): string {
  return err instanceof ApiError
    ? `API error (${err.status}): ${err.message}`
    : "Something went wrong loading this page. Please try again.";
}

// Lets Server Component pages render an inline error message instead of
// throwing — a thrown error would otherwise be caught by the nearest
// error.tsx boundary, which redacts the real message in production.
export async function safeLoad<T>(fn: () => Promise<T>): Promise<SafeResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) };
  }
}
