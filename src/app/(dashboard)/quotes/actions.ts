"use server";

import { revalidatePath } from "next/cache";
import { apiPut, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { QuoteStatus } from "@/lib/types";

export async function updateQuoteStatusAction(id: string, status: QuoteStatus) {
  const token = await requireToken();
  try {
    await apiPut(`/platform/quotes/${id}/status`, { status }, token);
  } catch (err) {
    throw err instanceof ApiError ? err : new Error("Failed to update quote status.");
  }
  revalidatePath("/quotes");
}
