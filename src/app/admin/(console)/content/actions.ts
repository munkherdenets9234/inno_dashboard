"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiPut } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { ContentEntry } from "@/lib/data/content";

export interface ContentFormState {
  error?: string;
  saved?: boolean;
}

// The editor serialises the whole page to one hidden field rather than a
// form input per leaf. With 40 entries in two languages that would be 80
// named inputs whose names encode dotted paths — and a path containing a dot
// inside a form field name is a bug waiting for whoever next reaches for
// nested form parsing.
export async function saveContentAction(
  page: string,
  _prevState: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const token = await requireToken();

  let entries: ContentEntry[];
  try {
    entries = JSON.parse(String(formData.get("entries") ?? "[]")) as ContentEntry[];
  } catch {
    return { error: "Could not read the form. Reload the page and try again." };
  }

  try {
    await apiPut(`/admin/content/${page}`, { entries }, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save." };
  }

  revalidatePath(`/admin/content/${page}`);
  return { saved: true };
}
