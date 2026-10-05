// Result shapes the console's forms hold in useActionState. Types only: the
// server actions that return them live next to the pages that use them, and
// the forms import from here so a form does not depend on where an action
// file sits.

export interface PlatformFormState {
  error?: string;
}

export interface CreateTenantState {
  error?: string;
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
