// Result shapes the console's forms hold in useActionState. Types only: the
// server actions that return them live next to the pages that use them, and
// the forms import from here so a form does not depend on where an action
// file sits.

// newKey is a one-time secret (service key, generated password). It lives in
// component state only: never in a URL, redirect, cookie, log or revalidated path.
export interface PlatformFormState {
  error?: string;
  newKey?: string;
}

export interface CreateTenantState {
  error?: string;
  newKey?: string;
  tenantId?: string;
  tenantName?: string;
}

export interface TenantIdentityState {
  error?: string;
  saved?: boolean;
}

export interface SubscriptionState {
  error?: string;
}

export interface PlanFormState {
  error?: string;
}
