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
