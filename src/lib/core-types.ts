// tenantcore's console models — internal/api/view/view.go and the entitlement
// document in internal/entitlement.
//
// These are a separate copy of a wire contract, not a shared import: the
// whole point of the split is that this console and that service can be
// deployed and rewritten independently. Adding a field on either side is
// safe; renaming one is not, and the older side reads a renamed field as a
// zero value rather than failing — which for `modules` means UNENFORCED, not
// "none". Add, never rename.

export type TenantStatus = "active" | "suspended";

// The tenant record as the platform knows it. There is no showcase/project
// content here and there never will be — that belongs to digitalservice, and
// is joined by id (see lib/data/tenant-content.ts).
export interface CoreTenant {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  // Last four characters of the tenant's API key. The key itself is stored
  // only as a hash and is shown exactly once, at create and at rotation.
  api_key_last4: string;
  // When set, binds the tenant's API key to one origin.
  domain?: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

// What POST /admin/tenants and POST /admin/tenants/{id}/rotate-key return.
// The raw key appears in that one response and nowhere else, ever.
export interface CreatedTenant {
  tenant: CoreTenant;
  api_key: string;
}

// A billing tier. NOT the same thing as digitalservice's Package, which is a
// pricing card a tenant shows its own visitors — that one is marketing copy
// and bilingual, this one is an entitlement and is never read by a visitor.
// Hence no locale maps here: Plan.name is one string, for this console.
export interface Plan {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  // How long one billing period runs. Stored per plan, so an annual tier
  // does not need a code change.
  period_days: number;
  // Which PRODUCTS this plan grants. Empty means no module gate is enforced
  // for tenants on this plan — a migration affordance for plans that predate
  // modules, and emphatically not "grants nothing".
  modules: string[];
  // Numeric ceilings keyed by a name the PRODUCT defines. An absent key means
  // unlimited, not zero; the two must stay distinguishable.
  limits: Record<string, number>;
  // On/off grants, keyed the same way. Absent is off.
  capabilities: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

// One per tenant, enforced by a unique index. A tenant who wants two products
// holds ONE subscription whose plan lists both modules — not two
// subscriptions.
export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  // Null when the plan was deleted out from under the subscription. That is a
  // real state, not an error: the billing record is still true.
  plan?: Plan;
}

// Exactly what a product service receives for this tenant — the same
// assembly, not a reimplementation, so what this console shows is what
// carwash or digitalservice will actually enforce.
export interface Entitlement {
  tenant_id: string;
  // "" (StatusUnknown) when the tenant has no subscription at all.
  status: SubscriptionStatus | "";
  // Zero time when no period is tracked, which Active treats as not expired.
  period_end: string;
  // Null, not [], when the tenant has no subscription or the plan was
  // deleted: these come from a Go nil slice/map, which serialises as null.
  // The plan view normalises its own nil maps; the entitlement document is
  // the product-facing contract and is rendered as it stands. Treat null and
  // [] the same — both mean the module gate is not enforced.
  modules: string[] | null;
  limits: Record<string, number> | null;
  features: Record<string, boolean> | null;
  // Set when the answer came from a cache because the platform could not be
  // reached. Never set on this route — the console reads it at the source.
  stale?: boolean;
}

export type ServiceClientStatus = "active" | "revoked";

// A product service permitted to ask tenantcore about entitlements.
export interface ServiceClient {
  id: string;
  name: string;
  key_last4: string;
  status: ServiceClientStatus;
  created_at: string;
  // Stamped on each successful authentication, best-effort. It is how you
  // find out that a service you thought was retired is still calling.
  last_seen_at?: string;
}

export interface CreatedServiceClient {
  service_client: ServiceClient;
  service_key: string;
}

export type PlatformUserStatus = "active" | "suspended";

// A member of the platform operator's own staff. Every one of them is a
// superadmin — there is one role at this level.
export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  status: PlatformUserStatus;
  created_at: string;
}
