import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";
import type { MailLogEntry } from "@/lib/types";

// The values tenantcore accepts for the filters. The server validates them
// again; this list only builds the dropdowns and stops a hand-edited URL
// from being forwarded.
export const MAIL_STATUSES = ["sent", "failed"] as const;
export const MAIL_TEMPLATES = [
  "lead_notification",
  "password_changed",
  "password_reset",
  "password_reset_code",
  "request_notification",
  "staff_invite",
  "subscription_expiring",
] as const;

// GET /admin/mail-log requires the superadmin Bearer token. Fetching it here
// is safe for the reason given in lib/data/tenants.ts: this runs on the
// server only.
export async function listMailLog(
  filters: { status?: string; template?: string },
  page = 1,
  limit = 20,
) {
  const token = await requireToken();
  const res = await apiGet<MailLogEntry[] | null>(
    "/admin/mail-log",
    { status: filters.status, template: filters.template, page, limit },
    token,
  );
  return { ...res, data: res.data ?? [] };
}
