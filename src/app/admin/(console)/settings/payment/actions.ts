"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiPut, ApiError } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";

export interface PaymentSettingsFormState {
  error?: string;
  saved?: boolean;
}

// Mirrors the server's rules for a friendlier message. The server validates
// again and is the authority; the request body is never logged.
const ACCOUNT_NUMBER = /^[A-Za-z0-9 -]{4,34}$/;
const SWIFT = /^([A-Za-z0-9]{8}|[A-Za-z0-9]{11})$/;

export async function savePaymentSettingsAction(
  _prev: PaymentSettingsFormState,
  formData: FormData,
): Promise<PaymentSettingsFormState> {
  const token = await requireToken();
  const text = (n: string) => String(formData.get(n) ?? "").trim();

  const body = {
    company_name: text("company_name"),
    company_tagline: text("company_tagline"),
    contact_person: text("contact_person"),
    bank_name: text("bank_name"),
    account_name: text("account_name"),
    account_number: text("account_number"),
    swift: text("swift"),
    instructions: text("instructions"),
  };
  if (!body.company_name) return { error: "Enter the company name." };
  if (body.company_name.length > 100) return { error: "Company name must be 100 characters or fewer." };
  if (body.company_tagline.length > 150) return { error: "Company tagline must be 150 characters or fewer." };
  if (body.contact_person.length > 100) return { error: "Contact person must be 100 characters or fewer." };
  if (!body.bank_name) return { error: "Enter the bank name." };
  if (body.bank_name.length > 100) return { error: "Bank name must be 100 characters or fewer." };
  if (!body.account_name) return { error: "Enter the account name." };
  if (body.account_name.length > 100) return { error: "Account name must be 100 characters or fewer." };
  if (!ACCOUNT_NUMBER.test(body.account_number)) {
    return { error: "Account number must be 4 to 34 characters: letters, digits, spaces and hyphens only." };
  }
  if (body.swift && !SWIFT.test(body.swift)) return { error: "SWIFT code must be 8 or 11 letters or digits, or empty." };
  if (body.instructions.length > 500) return { error: "Instructions must be 500 characters or fewer." };

  try {
    await apiPut("/admin/payment-settings", body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to save the payment settings." };
  }
  revalidatePath("/admin/settings/payment");
  revalidatePath("/admin/tenants", "layout");
  return { saved: true };
}
