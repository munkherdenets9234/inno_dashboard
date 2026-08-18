// Platform-level (superadmin) models — digitalservice's internal/models/
// tenant.go and tenant_detail.go. This app only ever talks to /platform/*
// routes, so there's no tenant-scoped concept (X-API-Key, tenant admin
// roles) anywhere in here.

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
// storefront. GET /platform/quotes lists every quote across the platform,
// tenant-linked and tenant-less alike; PUT /platform/quotes/{id}/status
// (superadmin) is the only way to act on a tenant-less lead.
export interface Quote {
  id: string;
  tenant_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  package_slug?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
  lastEditedBy?: string;
}

// One pricing tier in the platform's own global price-list catalog —
// managed centrally via /platform/packages, not per-tenant. Which tenants
// show a given package on their own storefront is a separate many-to-many
// assignment (see /platform/tenants/{id}/packages).
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
