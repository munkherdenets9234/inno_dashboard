"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import type { SubscriptionState } from "@/lib/form-state";
import type { Plan } from "@/lib/core-types";

// One form for both starting a subscription and moving an existing one to a
// different plan — the fields are identical, only the endpoint behind the
// bound action differs.
export default function SubscriptionForm({
  plans,
  currentPlanId,
  submitLabel,
  action,
}: {
  plans: Plan[];
  currentPlanId?: string;
  submitLabel: string;
  action: (prevState: SubscriptionState, formData: FormData) => Promise<SubscriptionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  // tenantcore refuses a subscription on an inactive plan, so offering one
  // here would only produce a 422 the operator has to decode.
  const options = plans.filter((p) => p.is_active);

  if (options.length === 0) {
    return (
      <p className="label text-paper/35">
        No active plans. Create one under Plans before subscribing a tenant.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5 min-w-56">
        <label className="label text-paper/70" htmlFor="plan_id">
          Plan
        </label>
        <select id="plan_id" name="plan_id" className={fieldInputClass} defaultValue={currentPlanId ?? ""}>
          {!currentPlanId && (
            <option value="" disabled>
              Select a plan…
            </option>
          )}
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.price.toLocaleString()} {p.currency} / {p.period_days}d
            </option>
          ))}
        </select>
      </div>
      <ActionButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </ActionButton>
      {state.error && <p className="label text-accent w-full">{state.error}</p>}
    </form>
  );
}
