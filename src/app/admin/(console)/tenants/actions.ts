"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api/client";
import { dsRequest } from "@/lib/api/digitalservice";
import { getInvoicePreview } from "@/lib/data/costing";
import { getOnboardingPreview } from "@/lib/data/onboarding";
import { requireToken } from "@/lib/auth/session";
import { validBillingDay } from "@/lib/subscription";
import type { InvoiceEditInput, LineDiscountInput, LocaleText, ProjectImage, ProjectMetric } from "@/lib/types";

export interface TenantProjectFormState {
  error?: string;
  saved?: boolean;
}

function jsonField<T>(formData: FormData, name: string): T | undefined {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function updateTenantProjectAction(
  id: string,
  _prevState: TenantProjectFormState,
  formData: FormData,
): Promise<TenantProjectFormState> {
  const token = await requireToken();

  const body = {
    tagline: jsonField<LocaleText>(formData, "tagline") ?? {},
    description: jsonField<LocaleText>(formData, "description") ?? {},
    category: String(formData.get("category") ?? "").trim(),
    website_url: String(formData.get("website_url") ?? "").trim(),
    cover_image: {
      url: String(formData.get("cover_image_url") ?? "").trim(),
      caption: String(formData.get("cover_image_caption") ?? "").trim(),
    },
    admin_cover: {
      url: String(formData.get("admin_cover_url") ?? "").trim(),
      caption: String(formData.get("admin_cover_caption") ?? "").trim(),
    },
    images: jsonField<ProjectImage[]>(formData, "images") ?? [],
    metrics: jsonField<ProjectMetric[]>(formData, "metrics") ?? [],
    showcase: formData.get("showcase") === "on",
    featured: formData.get("featured") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
  };

  try {
    await apiPut(`/admin/tenants/${id}/project`, body, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to save." };
  }

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  return { saved: true };
}

export interface AssignPackageFormState {
  error?: string;
}

export async function assignPackageAction(
  tenantId: string,
  _prevState: AssignPackageFormState,
  formData: FormData,
): Promise<AssignPackageFormState> {
  const token = await requireToken();
  const packageId = String(formData.get("package_id") ?? "").trim();
  if (!packageId) return { error: "Choose a package to assign." };

  try {
    // package_id, not plan_id. tenantcore's assignment endpoint keeps the
    // console's own vocabulary ("package") on the wire, while its
    // subscription endpoints say plan_id — the two handlers disagree on
    // purpose, so this is not a typo to "tidy" into matching.
    await apiPost(`/admin/tenants/${tenantId}/packages`, { package_id: packageId }, token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign package." };
  }

  revalidatePath(`/admin/tenants/${tenantId}`);
  return {};
}

export async function unassignPackageAction(tenantId: string, packageId: string) {
  const token = await requireToken();
  await apiDelete(`/admin/tenants/${tenantId}/packages/${packageId}`, token);
  revalidatePath(`/admin/tenants/${tenantId}`);
}

// ── Subscription ──────────────────────────────────────────────────────────
//
// These bind `plan_id`; assignPackageAction above binds `package_id`. tenantcore
// names them differently on purpose (subscriptions say plan, the package
// assignment keeps the console's own vocabulary), so do not unify them.
//
// All four share one signature, (tenantId, prevState, formData), so every
// outcome, including a 409 for renewing a cancelled subscription, reaches the
// page as a message through useActionState instead of throwing to an error
// boundary that redacts it in production.

export interface SubscriptionFormState {
  error?: string;
}

async function runSubscriptionAction(
  tenantId: string,
  call: (token: string) => Promise<unknown>,
  fallback: string,
): Promise<SubscriptionFormState> {
  const token = await requireToken();
  try {
    await call(token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : fallback };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return {};
}

function planIdOf(formData: FormData): string {
  return String(formData.get("plan_id") ?? "").trim();
}

export async function subscribeAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const planId = planIdOf(formData);
  if (!planId) return { error: "Choose a plan." };

  // Optional: left out, tenantcore applies the default (the 20th).
  const rawDay = String(formData.get("billing_day") ?? "").trim();
  const billingDay = rawDay === "" ? undefined : Number(rawDay);
  if (billingDay !== undefined && !validBillingDay(billingDay)) {
    return { error: "Billing day must be a whole number from 1 to 28." };
  }

  return runSubscriptionAction(
    tenantId,
    (token) =>
      apiPost(
        `/admin/tenants/${tenantId}/subscription`,
        billingDay === undefined ? { plan_id: planId } : { plan_id: planId, billing_day: billingDay },
        token,
      ),
    "Failed to create the subscription.",
  );
}

export async function changePlanAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const planId = planIdOf(formData);
  if (!planId) return { error: "Choose a plan." };
  return runSubscriptionAction(
    tenantId,
    (token) => apiPut(`/admin/tenants/${tenantId}/subscription/plan`, { plan_id: planId }, token),
    "Failed to change the plan.",
  );
}

// Renew and cancel take no input, so they are typed as the shared action shape
// and simply ignore the state and form data useActionState passes them.
type SubscriptionAction = (
  tenantId: string,
  prev: SubscriptionFormState,
  formData: FormData,
) => Promise<SubscriptionFormState>;

export const renewSubscriptionAction: SubscriptionAction = async (tenantId) => {
  return runSubscriptionAction(
    tenantId,
    (token) => apiPost(`/admin/tenants/${tenantId}/subscription/renew`, {}, token),
    "Failed to renew the subscription.",
  );
};

export const cancelSubscriptionAction: SubscriptionAction = async (tenantId) => {
  return runSubscriptionAction(
    tenantId,
    (token) => apiPost(`/admin/tenants/${tenantId}/subscription/cancel`, {}, token),
    "Failed to cancel the subscription.",
  );
};

// Changes the day future periods end on. Never moves the current period end:
// moving it earlier would silently take days the tenant already paid for, and
// Renew is how the current end moves.
export async function setBillingDayAction(
  tenantId: string,
  _prev: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const day = Number(String(formData.get("billing_day") ?? "").trim());
  if (!validBillingDay(day)) return { error: "Billing day must be a whole number from 1 to 28." };
  return runSubscriptionAction(
    tenantId,
    (token) => apiPut(`/admin/tenants/${tenantId}/subscription/billing-day`, { billing_day: day }, token),
    "Failed to change the billing day.",
  );
}

// ── Domains ───────────────────────────────────────────────────────────────
//
// Bookkeeping records (tenantcore tenant_domains). Validation is the server's;
// the checks here only shape the form into the request body.

export interface DomainFormState {
  error?: string;
  saved?: boolean;
}

const DOMAIN_TEXT_FIELDS = [
  "name",
  "registrant_name",
  "registrant_owner",
  "registrar",
  "registrar_account_email",
  "dns_provider",
  "dns_provider_email",
  "ssl_provider",
  "tech_contact_email",
  "billing_contact_email",
  "notes",
] as const;

function dateField(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : null;
}

function domainBody(formData: FormData) {
  const body: Record<string, unknown> = {};
  for (const f of DOMAIN_TEXT_FIELDS) body[f] = String(formData.get(f) ?? "").trim();
  const text = (n: string) => String(formData.get(n) ?? "").trim();
  body.is_primary = formData.get("is_primary") === "on";
  body.auto_renew = formData.get("auto_renew") === "on";
  body.registrar_lock = formData.get("registrar_lock") === "on";
  body.dns_verified = formData.get("dns_verified") === "on";
  body.expires_at = dateField(formData, "expires_at");
  body.dns_checked_at = dateField(formData, "dns_checked_at");
  body.ssl_expires_at = dateField(formData, "ssl_expires_at");
  body.subdomains = jsonField<unknown[]>(formData, "subdomains") ?? [];
  body.deployment = {
    provider: text("deployment_provider"),
    provider_email: text("deployment_provider_email"),
    environment: text("deployment_environment"),
    region: text("deployment_region"),
    resource_id: text("deployment_resource_id"),
    address: text("deployment_address"),
    dns_target: text("deployment_dns_target"),
  };
  return body;
}

// Amounts are whole MNT, 0 or more; the server re-validates everything and
// derives the paid/unpaid status itself (none is sent from here).
function amountField(formData: FormData, name: string): number | null {
  const v = String(formData.get(name) ?? "").trim();
  return v === "" ? 0 : wholeNumber(v);
}

function paymentBody(formData: FormData): { payment: Record<string, unknown> } | { error: string } {
  const text = (n: string) => String(formData.get(n) ?? "").trim();
  const clientAmount = amountField(formData, "client_amount");
  const registrarAmount = amountField(formData, "registrar_amount");
  if (clientAmount === null) return { error: "Client charge must be a whole number of MNT, 0 or more." };
  if (registrarAmount === null) return { error: "Registrar cost must be a whole number of MNT, 0 or more." };
  for (const [name, label] of [
    ["client_paid_at", "client paid on"],
    ["client_paid_through", "client paid through"],
    ["registrar_paid_at", "registrar paid on"],
    ["registrar_paid_through", "registrar paid through"],
  ] as const) {
    if (text(name) && !dateField(formData, name)) return { error: `Enter ${label} as a date.` };
  }
  return {
    payment: {
      client_charge: {
        amount: clientAmount,
        paid_at: dateField(formData, "client_paid_at"),
        paid_through: dateField(formData, "client_paid_through"),
        method: text("client_method"),
        reference: text("client_reference"),
      },
      registrar_cost: {
        amount: registrarAmount,
        paid_at: dateField(formData, "registrar_paid_at"),
        paid_through: dateField(formData, "registrar_paid_through"),
        payer: text("registrar_payer"),
        method: text("registrar_method"),
        reference: text("registrar_reference"),
      },
    },
  };
}

// domainId "" creates; otherwise it replaces that record's fields.
export async function saveDomainAction(
  tenantId: string,
  domainId: string,
  _prev: DomainFormState,
  formData: FormData,
): Promise<DomainFormState> {
  const token = await requireToken();
  const body = domainBody(formData);
  if (!body.name) return { error: "Enter a domain name." };
  const pay = paymentBody(formData);
  if ("error" in pay) return { error: pay.error };
  body.payment = pay.payment;
  try {
    if (domainId) await apiPut(`/admin/tenants/${tenantId}/domains/${domainId}`, body, token);
    else await apiPost(`/admin/tenants/${tenantId}/domains`, body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to save the domain." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

export async function deleteDomainAction(
  tenantId: string,
  domainId: string,
): Promise<DomainFormState> {
  const token = await requireToken();
  try {
    await apiDelete(`/admin/tenants/${tenantId}/domains/${domainId}`, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to delete the domain." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// Settles a domain's registrar cost with the server's defaults (paid now,
// through the expiry, payer us). Nothing about the amount is sent from here.
export async function registrarPaidAction(
  tenantId: string,
  domainId: string,
): Promise<DomainFormState> {
  const token = await requireToken();
  try {
    await apiPost(`/admin/tenants/${tenantId}/domains/${domainId}/registrar-paid`, {}, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to mark the registrar cost paid." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// ── Fees and invoices ─────────────────────────────────────────────────────
//
// Bookkeeping records (tenantcore tenant_fees and invoices). Amounts, totals,
// numbers and the invoice recipient are all the server's: these actions send
// only choices (fee ids, a tax rate, a due date) and never a computed figure.

export interface CostingFormState {
  error?: string;
  saved?: boolean;
}

function wholeNumber(raw: string): number | null {
  if (!/^\d{1,13}$/.test(raw)) return null;
  return Number(raw);
}

// feeId "" creates; otherwise it replaces that fee's editable fields.
export async function saveFeeAction(
  tenantId: string,
  feeId: string,
  _prev: CostingFormState,
  formData: FormData,
): Promise<CostingFormState> {
  const token = await requireToken();
  const text = (n: string) => String(formData.get(n) ?? "").trim();
  const amount = wholeNumber(text("amount"));
  if (!text("label")) return { error: "Enter a label." };
  if (amount === null) return { error: "Amount must be a whole number of MNT, 0 or more." };

  const body: Record<string, unknown> = {
    kind: text("kind"),
    label: text("label"),
    amount,
    interval: text("interval"),
    domain_id: text("kind") === "domain" ? text("domain_id") : "",
    active: formData.get("active") === "on",
  };
  const through = dateField(formData, "last_invoiced_through");
  if (through) body.last_invoiced_through = through;

  try {
    if (feeId) await apiPut(`/admin/tenants/${tenantId}/fees/${feeId}`, body, token);
    else await apiPost(`/admin/tenants/${tenantId}/fees`, body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to save the fee." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

export async function deleteFeeAction(tenantId: string, feeId: string): Promise<CostingFormState> {
  const token = await requireToken();
  try {
    await apiDelete(`/admin/tenants/${tenantId}/fees/${feeId}`, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to delete the fee." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// "10" or "8.25" (percent) to basis points; "" means no tax.
function taxRateBp(raw: string): number | undefined | "invalid" {
  if (raw === "") return undefined;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw)) return "invalid";
  const bp = Math.round(Number(raw) * 100);
  return bp >= 0 && bp <= 10000 ? bp : "invalid";
}

// Reads the per-line discount controls (disc_type_<id> "amount" | "percent",
// disc_value_<id>, disc_reason_<id>) of the given line ids. Only choices are
// read: the server computes the stored discount. A line with no value has no
// discount; with clear, it is sent as an empty object so an edit clears it.
function discountsFromForm(
  formData: FormData,
  ids: string[],
  clear: boolean,
): { discounts: Record<string, LineDiscountInput> } | { error: string } {
  const out: Record<string, LineDiscountInput> = {};
  for (const id of ids) {
    const raw = String(formData.get(`disc_value_${id}`) ?? "").trim();
    if (raw === "") {
      if (clear) out[id] = {};
      continue;
    }
    const reason = String(formData.get(`disc_reason_${id}`) ?? "").trim();
    if (reason.length > 100) return { error: "A discount reason can be at most 100 characters." };
    const d: LineDiscountInput = {};
    if (formData.get(`disc_type_${id}`) === "percent") {
      const bp = taxRateBp(raw);
      if (bp === "invalid" || bp === undefined) return { error: "A discount percent must be from 0 to 100, with up to two decimals." };
      d.percent_bp = bp;
    } else {
      const amount = wholeNumber(raw);
      if (amount === null) return { error: "A discount amount must be a whole number of MNT, 0 or more." };
      d.amount = amount;
    }
    if (reason) d.reason = reason;
    out[id] = d;
  }
  return { discounts: out };
}

export async function createInvoiceAction(
  tenantId: string,
  _prev: CostingFormState,
  formData: FormData,
): Promise<CostingFormState> {
  const token = await requireToken();
  const feeIds = formData.getAll("fee_ids").map(String).filter(Boolean);
  if (feeIds.length === 0) return { error: "Select at least one line." };

  const bp = taxRateBp(String(formData.get("tax_rate") ?? "").trim());
  if (bp === "invalid") return { error: "Tax rate must be a percentage from 0 to 100, with up to two decimals." };

  const parsed = discountsFromForm(formData, feeIds, false);
  if ("error" in parsed) return { error: parsed.error };
  const { discounts } = parsed;

  const body: Record<string, unknown> = { fee_ids: feeIds };
  if (Object.keys(discounts).length > 0) body.discounts = discounts;
  if (bp !== undefined) body.tax_rate_bp = bp;
  const dueAt = dateField(formData, "due_at");
  if (String(formData.get("due_at") ?? "").trim() && !dueAt) return { error: "Enter the due date as a date." };
  if (dueAt) body.due_at = dueAt;

  try {
    await apiPost(`/admin/tenants/${tenantId}/invoices`, body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to create the invoice." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// Edits the due date, tax rate and line discounts of a draft invoice (PUT).
// Only choices are sent; the server recomputes the totals and refuses anything
// but a draft.
export async function editInvoiceAction(
  tenantId: string,
  invoiceId: string,
  _prev: CostingFormState,
  formData: FormData,
): Promise<CostingFormState> {
  const token = await requireToken();
  const bp = taxRateBp(String(formData.get("tax_rate") ?? "").trim());
  if (bp === "invalid") return { error: "Tax rate must be a percentage from 0 to 100, with up to two decimals." };

  const parsed = discountsFromForm(formData, formData.getAll("line_keys").map(String).filter(Boolean), true);
  if ("error" in parsed) return { error: parsed.error };
  const { discounts } = parsed;

  const body: InvoiceEditInput = { tax_rate_bp: bp ?? 0 };
  if (Object.keys(discounts).length > 0) body.discounts = discounts;
  const rawDue = String(formData.get("due_at") ?? "").trim();
  const dueAt = dateField(formData, "due_at");
  if (rawDue && !dueAt) return { error: "Enter the due date as a date." };
  if (dueAt) body.due_at = dueAt;

  try {
    await apiPut(`/admin/tenants/${tenantId}/invoices/${invoiceId}`, body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to save the invoice." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

export type InvoiceStep = "send" | "resend" | "void";

const INVOICE_FAILURES: Record<InvoiceStep, string> = {
  send: "Failed to send the invoice.",
  resend: "Failed to send the invoice.",
  void: "Failed to void the invoice.",
};

const PAY_METHODS = ["bank_transfer", "cash", "card", "other"];

// Marks a sent invoice paid and records the transaction. The amount is only
// a confirmation: the server requires it to equal the invoice total. Nothing
// here is logged.
export async function markInvoicePaidAction(
  tenantId: string,
  invoiceId: string,
  total: number,
  _prev: CostingFormState,
  formData: FormData,
): Promise<CostingFormState> {
  const token = await requireToken();
  const text = (n: string) => String(formData.get(n) ?? "").trim();

  const method = text("method") || "bank_transfer";
  if (!PAY_METHODS.includes(method)) return { error: "Choose a payment method." };
  const paidAt = text("paid_at");
  if (paidAt && !/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return { error: "Enter the payment date as a date." };
  const last4 = text("payer_account_last4");
  if (last4 && !/^\d{4}$/.test(last4)) return { error: "Enter exactly the last 4 digits of the payer's account, or leave it empty." };
  const reference = text("reference");
  if (reference.length > 100) return { error: "Reference must be 100 characters or fewer." };
  const payerName = text("payer_name");
  if (payerName.length > 100) return { error: "Payer name must be 100 characters or fewer." };
  const note = text("note");
  if (note.length > 500) return { error: "Note must be 500 characters or fewer." };

  const body: Record<string, unknown> = { method, amount_received: total };
  if (paidAt) body.paid_at = paidAt;
  if (reference) body.reference = reference;
  if (payerName) body.payer_name = payerName;
  if (last4) body.payer_account_last4 = last4;
  if (note) body.note = note;

  try {
    await apiPost(`/admin/tenants/${tenantId}/invoices/${invoiceId}/paid`, body, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to mark the invoice paid." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// One action for the four buttons. The recipient of a send is resolved by
// tenantcore from the tenant's contact email; nothing about it is sent here.
export async function invoiceStepAction(
  tenantId: string,
  invoiceId: string,
  step: InvoiceStep,
): Promise<CostingFormState> {
  const token = await requireToken();
  const base = `/admin/tenants/${tenantId}/invoices/${invoiceId}`;
  try {
    if (step === "send") await apiPost(`${base}/send`, {}, token);
    else if (step === "resend") await apiPost(`${base}/send`, { resend: true }, token);
    else await apiPost(`${base}/${step}`, {}, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : INVOICE_FAILURES[step] };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// Deletes a draft invoice (the server refuses any other status with a 409).
export async function deleteInvoiceAction(tenantId: string, invoiceId: string): Promise<CostingFormState> {
  const token = await requireToken();
  try {
    await apiDelete(`/admin/tenants/${tenantId}/invoices/${invoiceId}`, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to delete the invoice." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// The rendered invoice mail for the Preview button. Read only: nothing is
// sent and the invoice does not change. The HTML is shown in a sandboxed
// iframe by the caller.
export interface InvoicePreviewState {
  error?: string;
  subject?: string;
  html?: string;
}

export async function previewInvoiceAction(tenantId: string, invoiceId: string): Promise<InvoicePreviewState> {
  try {
    const p = await getInvoicePreview(tenantId, invoiceId);
    return { subject: p.subject, html: p.html };
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to render the preview." };
  }
}

// ── Onboarding email ──────────────────────────────────────────────────────
//
// The recipient is the tenant's contact email, resolved by tenantcore. Only
// the optional note and the resend flag are sent. The note is never logged.

// The service validates the note as a single line, so fold newlines and runs
// of whitespace into single spaces (never lengthens the text).
function oneLineNote(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export async function previewOnboardingAction(tenantId: string, note: string): Promise<InvoicePreviewState> {
  try {
    const p = await getOnboardingPreview(tenantId, oneLineNote(note));
    return { subject: p.subject, html: p.html };
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to render the preview." };
  }
}

export async function sendOnboardingAction(
  tenantId: string,
  resend: boolean,
  _prev: CostingFormState,
  formData: FormData,
): Promise<CostingFormState> {
  const token = await requireToken();
  const note = oneLineNote(String(formData.get("note") ?? ""));
  try {
    await apiPost(`/admin/tenants/${tenantId}/onboarding/send`, { note, resend }, token);
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to send the onboarding email." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { saved: true };
}

// ── Detail page: key rotation and admin password reset ────────────────────
//
// A raw key exists only in the returned state (shown once by the page). It is
// never logged, stored, redirected with or put in a URL.

export interface RotateKeyState {
  error?: string;
  newKey?: string;
}

export async function rotateTenantKeyAction(
  tenantId: string,
): Promise<RotateKeyState> {
  const token = await requireToken();
  let newKey: string;
  try {
    const res = await apiPost<{ api_key: string }>(`/admin/tenants/${tenantId}/rotate-key`, {}, token);
    newKey = res.data.api_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to rotate the key." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { newKey };
}

export async function rotateServiceKeyAction(
  serviceClientId: string,
  tenantId: string,
): Promise<RotateKeyState> {
  const token = await requireToken();
  let newKey: string;
  try {
    const res = await apiPost<{ service_key: string }>(
      `/admin/service-clients/${serviceClientId}/rotate`,
      {},
      token,
    );
    newKey = res.data.service_key;
  } catch (err) {
    unstable_rethrow(err);
    return { error: err instanceof ApiError ? err.message : "Failed to rotate the key." };
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { newKey };
}

export interface ResetPasswordState {
  error?: string;
  sent?: boolean;
}

export async function resetAdminPasswordAction(
  tenantId: string,
  userId: string,
): Promise<ResetPasswordState> {
  const token = await requireToken();
  try {
    await dsRequest(
      "POST",
      `/platform/tenants/${encodeURIComponent(tenantId)}/admin-users/${encodeURIComponent(userId)}/reset-password`,
      token,
    );
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiError) {
      if (err.status === 503) return { error: "Email isn't set up on this server" };
      return { error: err.message };
    }
    return { error: "Failed to send the reset code." };
  }
  return { sent: true };
}
