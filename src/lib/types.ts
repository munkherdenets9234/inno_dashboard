// Platform-level (superadmin) models — tenantcore's internal/models/showcase.go
// and internal/api/view. This app only ever talks to /admin/* routes, so
// there's no tenant-scoped concept (X-API-Key, tenant admin roles) anywhere
// in here.

export type LocaleText = { en?: string; mn?: string };
export type LocaleList = { en?: string[]; mn?: string[] };

export interface ProjectImage {
  url: string;
  caption: string;
}

export interface ProjectMetric {
  label: LocaleText;
  value: string;
}

export interface TenantDetail {
  tagline?: LocaleText;
  description?: LocaleText;
  category?: string;
  // The project's own live site, shown as `live_url` on the public read
  // (falling back to the tenant's bound Domain if unset).
  website_url?: string;
  cover_image?: ProjectImage;
  // Curated separately from cover_image (the case-study detail page's hero
  // banner) — used for front-page/list display instead.
  admin_cover?: ProjectImage;
  images?: ProjectImage[];
  metrics?: ProjectMetric[];
  showcase: boolean;
  featured: boolean;
  sort_order?: number;
}

export type TenantStatus = "active" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contact_email?: string;
  api_key_last4?: string;
  domain?: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
  project?: TenantDetail;
}

export type QuoteStatus = "new" | "contacted" | "quoted" | "closed";

// A "request a quote" lead. Most have no tenant relationship at all — a
// prospect inquiring before ever signing up — so tenant_id is optional,
// present only when the lead came through an existing tenant's own
// storefront. GET /admin/quotes lists every quote across the platform,
// tenant-linked and tenant-less alike; PUT /admin/quotes/{id}/status
// (superadmin) is the only way to act on a tenant-less lead.
export interface Quote {
  id: string;
  tenant_id?: string;
  // Set when an admin promoted this prospect into a tenant. Distinct from
  // tenant_id, which means "came through that tenant's storefront".
  promoted_tenant_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  plan_slug?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
  lastEditedBy?: string;
}

// One pricing tier in the platform's own global price-list catalog —
// managed centrally via /admin/plans, not per-tenant (tenantcore calls the
// underlying record a Plan; this app only ever edits its public pricing-card
// content, translated at the fetch boundary in lib/data/packages.ts). Which
// tenants show a given package on their own storefront is a separate
// many-to-many assignment (see /admin/tenants/{id}/packages).
export interface Package {
  id: string;
  slug: string;
  name: LocaleText;
  tagline: LocaleText;
  price: number;
  currency: string;
  billing_note: LocaleText;
  features: LocaleList;
  highlighted: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lastEditedBy?: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

// A tenant's subscription as GET /admin/tenants/{id}/subscription returns it.
// `plan` is null (or absent) when the plan was deleted out from under a live
// subscription: the billing state is still true and still needs to render.
export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  // The day of the month it renews on (1 to 28). Always present: the API reports
  // the day the system will act on, so a subscription predating the field reads 20.
  billing_day: number;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string | null;
  plan?: {
    id: string;
    slug: string;
    name: string;
    price: number;
    currency: string;
    period_days: number;
  } | null;
}

// A registered product service (tenantcore view.ServiceClient). The raw key is
// never part of this shape; it is returned once by create/rotate.
export interface ServiceClient {
  id: string;
  name: string;
  status: "active" | "revoked";
  key_last4: string;
  created_at: string;
  last_seen_at?: string | null;
}

// An admin user of a tenant, as digitalservice lists them. No password hash.
export interface TenantAdminUser {
  id: string;
  email: string;
  name: string;
  status: "active" | "suspended";
}

// One send attempt from tenantcore's mail log. No body, subject or code is
// stored, so there is nothing of the sort to show.
export interface MailLogEntry {
  id: string;
  created_at: string;
  template: string;
  to: string;
  status: "sent" | "failed";
  error?: string;
  // "system" for tenantcore's own mail, else the service client that asked.
  source: string;
  tenant_id?: string;
}

// A domain record the operator keeps for a tenant (tenantcore tenant_domains).
// Bookkeeping only: it never changes routing or API-key binding.
export type DomainOwner = "" | "us" | "client";
export type SubdomainPurpose = "app" | "api" | "admin" | "other";
export type DeploymentEnvironment = "" | "prod" | "staging";

export interface TenantSubdomain {
  name: string;
  purpose: SubdomainPurpose;
  target: string;
  status: string;
}

export interface DomainDeployment {
  provider: string;
  provider_email: string;
  environment: DeploymentEnvironment;
  region: string;
  resource_id: string;
  address: string;
  dns_target: string;
}

// Both sides of a domain's money (whole MNT, >= 0). The statuses are derived
// by tenantcore and never sent: paid when paid_through is on or after the
// domain's expires_at, unpaid when an amount is set and it is not, none when
// the amount is 0. A renewal (expires_at moved forward) makes it unpaid again.
export type PaymentStatus = "none" | "paid" | "unpaid";
export type PaymentMethod = "" | "cash" | "bank" | "card" | "other";
export type RegistrarPayer = "" | "us" | "client";

export interface ClientCharge {
  amount: number;
  paid_at: string | null;
  paid_through: string | null;
  method: PaymentMethod;
  reference: string;
}

export interface RegistrarCost {
  amount: number;
  paid_at: string | null;
  paid_through: string | null;
  payer: RegistrarPayer;
  method: PaymentMethod;
  reference: string;
}

export interface DomainPayment {
  client_charge: ClientCharge & { status: PaymentStatus };
  registrar_cost: RegistrarCost & { status: PaymentStatus };
  // client amount minus registrar amount; null unless both are above 0.
  margin: number | null;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  name: string;
  is_primary: boolean;
  registrant_name: string;
  registrant_owner: DomainOwner;
  registrar: string;
  registrar_account_email: string;
  dns_provider: string;
  dns_provider_email: string;
  expires_at: string | null;
  auto_renew: boolean;
  registrar_lock: boolean;
  subdomains: TenantSubdomain[];
  deployment: DomainDeployment;
  dns_verified: boolean;
  dns_checked_at: string | null;
  ssl_provider: string;
  ssl_expires_at: string | null;
  tech_contact_email: string;
  billing_contact_email: string;
  notes: string;
  payment: DomainPayment;
  created_at: string;
  updated_at: string;
}

// A fee the operator bills a tenant (tenantcore tenant_fees), the costing view
// derived from fees, and the invoices made from it. Money is whole MNT.
export type FeeKind = "domain" | "deployment" | "other";
export type FeeInterval = "monthly" | "yearly" | "one_time";

export interface TenantFee {
  id: string;
  tenant_id: string;
  kind: FeeKind;
  label: string;
  amount: number;
  currency: "MNT";
  interval: FeeInterval;
  domain_id: string | null;
  active: boolean;
  last_invoiced_through: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantFeeCosting extends TenantFee {
  next_due_at: string | null;
  due: boolean;
  domain_name?: string;
  // Client charge status of the linked domain (domain fees only). For a domain
  // with a client charge, amount is that charge and unpaid means due now.
  payment_status?: PaymentStatus;
  // Number of the draft, sent or paid invoice already billing this period.
  invoiced_on?: string;
}

// A domain with a client charge that no fee bills: a derived line, selected in
// an invoice request by its id ("domain:<domainId>"). Due while unpaid.
export interface DomainCostLine {
  id: string;
  domain_id: string;
  domain_name: string;
  label: string;
  amount: number;
  currency: "MNT";
  payment_status: PaymentStatus;
  next_due_at: string | null;
  due: boolean;
  invoiced_on?: string;
}

// Domains whose registrar cost is unpaid. Never put on a tenant invoice.
export interface RegistrarPayable {
  domain_id: string;
  domain_name: string;
  amount: number;
  expires_at: string | null;
  payer: RegistrarPayer;
  margin: number | null;
}

export interface DomainMargin {
  domain_id: string;
  domain_name: string;
  margin: number;
}

export interface CostingPayables {
  items: RegistrarPayable[];
  margins: DomainMargin[];
  receivable_total: number;
  payable_total: number;
}

export interface SubscriptionCostLine {
  id: "subscription";
  label: string;
  amount: number;
  currency: "MNT";
  plan_name: string;
  status: string;
  next_due_at: string | null;
  due: boolean;
  invoiced_on?: string;
}

export interface TenantCosting {
  currency: "MNT";
  lead_days: number;
  fees: TenantFeeCosting[];
  subscription: SubscriptionCostLine | null;
  domain_lines: DomainCostLine[];
  payables: CostingPayables;
  due_total: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface InvoiceLine {
  label: string;
  amount: number;
  fee_id: string | null;
  domain_id?: string | null;
  kind: "subscription" | FeeKind;
  period: string;
  // The selection id the line was made from ("subscription", "domain:<id>" or
  // a fee id). Empty on invoices made before it existed; see invoiceLineKey.
  line_key?: string;
  // amount is the gross price. discount (whole MNT, computed by the server) is
  // taken off it: net = amount - discount. Absent or 0 when there is none.
  discount?: number;
  // The percent the operator entered, in basis points; display only.
  discount_bp?: number;
  discount_reason?: string;
}

// A discount choice for one line (POST/PUT invoices body, `discounts` keyed by
// selection id / line key). Exactly one of amount and percent_bp; an empty
// object clears the line's discount on an edit. The server computes the
// stored discount.
export interface LineDiscountInput {
  amount?: number;
  percent_bp?: number;
  reason?: string;
}

// The id a line is addressed by when discounts are edited.
export function invoiceLineKey(l: InvoiceLine): string {
  if (l.line_key) return l.line_key;
  if (l.fee_id) return l.fee_id;
  if (l.domain_id) return `domain:${l.domain_id}`;
  return l.kind === "subscription" ? "subscription" : "";
}

// The platform's own bank details (GET/PUT /admin/payment-settings). Nothing
// saved yet is empty strings with configured false.
export interface PaymentSettings {
  // The issuer printed on the invoice; the company name is required.
  company_name: string;
  company_tagline: string;
  contact_person: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift: string;
  instructions: string;
  updated_at: string | null;
  user_id: string | null;
  configured: boolean;
}

// Snapshot of the settings taken when an invoice was first sent.
export interface PaymentInstructions {
  // Empty on invoices sent before the issuer fields existed.
  company_name: string;
  company_tagline: string;
  contact_person: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift: string;
  instructions: string;
}

export type InvoicePayMethod = "bank_transfer" | "cash" | "card" | "other";

// The transaction record captured when an invoice was marked paid.
export interface InvoicePayment {
  method: InvoicePayMethod;
  reference: string;
  payer_name: string;
  payer_account_last4: string;
  amount_received: number;
  note: string;
}

// PUT .../invoices/{id} body (draft invoices only). Every field is optional,
// at least one is required; the server recomputes discount total, tax and total.
export interface InvoiceEditInput {
  due_at?: string;
  tax_rate_bp?: number;
  discounts?: Record<string, LineDiscountInput>;
}

// GET .../invoices/{id}/preview: the invoice mail as rendered, not sent.
export interface InvoicePreview {
  subject: string;
  text: string;
  html: string;
}

// GET .../onboarding: whether the welcome email was sent, and what blocks it.
export interface OnboardingStatus {
  sent_at: string | null;
  sent_to: string;
  can_send: boolean;
  blockers: string[];
}

export interface Invoice {
  id: string;
  tenant_id: string;
  number: string;
  issued_at: string;
  due_at: string | null;
  lines: InvoiceLine[];
  // subtotal is the sum of the gross line amounts; tax is on subtotal minus
  // discount_total and total (the net amount to pay) is that base plus tax.
  subtotal: number;
  discount_total?: number;
  tax_rate_bp: number;
  tax_amount: number;
  total: number;
  currency: "MNT";
  status: InvoiceStatus;
  sent_at: string | null;
  sent_to: string;
  paid_at: string | null;
  payment_instructions: PaymentInstructions | null;
  payment: InvoicePayment | null;
  created_at: string;
  updated_at: string;
}
