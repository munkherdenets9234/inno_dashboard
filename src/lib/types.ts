// Platform-level (superadmin) models — digitalservice's internal/models/
// tenant.go and tenant_detail.go. This app only ever talks to /platform/*
// routes, so there's no tenant-scoped concept (X-API-Key, tenant admin
// roles) anywhere in here.

export type LocaleText = { en?: string; mn?: string };

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
  cover_image?: ProjectImage;
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
