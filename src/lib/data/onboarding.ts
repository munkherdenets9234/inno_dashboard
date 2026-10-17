import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { InvoicePreview, OnboardingStatus } from "@/lib/types";

// GET /admin/tenants/{id}/onboarding: when the welcome email was sent, to
// whom, and what currently blocks sending.
export async function getOnboardingStatus(tenantId: string): Promise<OnboardingStatus> {
  const token = await requireToken();
  const res = await apiGet<OnboardingStatus>(`/admin/tenants/${tenantId}/onboarding`, undefined, token);
  return res.data;
}

// GET /admin/tenants/{id}/onboarding/preview?note=: the email as rendered with
// the same renderer Send uses. Nothing is sent and nothing changes.
export async function getOnboardingPreview(tenantId: string, note: string): Promise<InvoicePreview> {
  const token = await requireToken();
  const res = await apiGet<InvoicePreview>(
    `/admin/tenants/${tenantId}/onboarding/preview?note=${encodeURIComponent(note)}`,
    undefined,
    token,
  );
  return res.data;
}
