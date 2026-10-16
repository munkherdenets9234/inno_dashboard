import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { PaymentSettings } from "@/lib/types";

// GET /admin/payment-settings: the platform's own bank details. Nothing saved
// yet is an object with empty fields and configured false.
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const token = await requireToken();
  const res = await apiGet<PaymentSettings>("/admin/payment-settings", undefined, token);
  return res.data;
}
