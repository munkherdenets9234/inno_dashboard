"use server";

import { revalidatePath } from "next/cache";
import { apiPut, apiPost, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { QuoteStatus, Tenant } from "@/lib/types";
import { normalizeQuoteLink } from "@/lib/promote.mjs";
import type { QuoteLink } from "@/lib/promote.mjs";

export async function updateQuoteStatusAction(id: string, status: QuoteStatus) {
  const token = await requireToken();
  try {
    await apiPut(`/admin/quotes/${id}/status`, { status }, token);
  } catch (err) {
    throw err instanceof ApiError ? err : new Error("Failed to update quote status.");
  }
  revalidatePath("/admin/quotes");
}

export type PromoteQuoteInput = {
  name: string;
  slug: string;
  contact_email?: string;
  domain?: string;
};

export type PromoteQuoteResult =
  | {
      ok: true;
      tenant: { id: string; name: string; slug: string };
      apiKey: string;
      quoteLinked: boolean;
      quoteLink: QuoteLink;
    }
  | { ok: false; error: string };

type PromoteResponse = {
  tenant: Pick<Tenant, "id" | "name" | "slug">;
  api_key: string;
  quote_linked: boolean;
  quote_link?: string;
};

const GENERIC_PROMOTE_ERROR = "Could not promote this quote. Try again.";

// Promotes a prospect quote into a tenant. The new tenant's API key comes back
// in the response and is returned to the caller only: it is not logged, not
// part of any error text and not an argument to revalidatePath. Errors are
// returned, not thrown, so the client form can show them inline.
export async function promoteQuoteAction(id: string, input: PromoteQuoteInput): Promise<PromoteQuoteResult> {
  // Outside the try: an expired session redirects, and that must reach Next.
  const token = await requireToken();

  const body: PromoteQuoteInput = { name: input.name, slug: input.slug };
  if (input.contact_email) body.contact_email = input.contact_email;
  if (input.domain) body.domain = input.domain;

  let data: PromoteResponse;
  try {
    const res = await apiPost<PromoteResponse>(`/admin/quotes/${encodeURIComponent(id)}/promote`, body, token);
    data = res.data;
  } catch (err) {
    if (err instanceof ApiError) {
      // 4xx messages are the backend's own (already generic); the 401
      // redirect has been handled inside the client.
      return {
        ok: false,
        error: err.status >= 400 && err.status < 500 && err.message ? err.message : GENERIC_PROMOTE_ERROR,
      };
    }
    // Rethrow Next's control-flow errors (redirect, not-found).
    const digest = (err as { digest?: unknown } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_")) throw err;
    return { ok: false, error: GENERIC_PROMOTE_ERROR };
  }

  if (!data || typeof data.api_key !== "string" || !data.tenant?.id) {
    return { ok: false, error: GENERIC_PROMOTE_ERROR };
  }

  revalidatePath("/admin/quotes");
  return {
    ok: true,
    tenant: { id: data.tenant.id, name: data.tenant.name, slug: data.tenant.slug },
    apiKey: data.api_key,
    quoteLinked: data.quote_linked === true,
    quoteLink: normalizeQuoteLink(data.quote_link, data.quote_linked),
  };
}
