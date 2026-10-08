"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { PlanFormState } from "@/lib/form-state";
import type { Plan } from "@/lib/core-types";

// The entitlement fields are free text on purpose. `modules`, `limits` and
// `capabilities` are keyed by names the PRODUCT defines — tenantcore stores
// them and never interprets them — so this console has no list to offer, and
// a dropdown built from one would be wrong the first time a product adds a
// key without telling anyone.
function limitsToText(limits: Record<string, number>) {
  return Object.entries(limits)
    .map(([k, v]) => `${k} = ${v}`)
    .join("\n");
}

function capabilitiesToText(caps: Record<string, boolean>) {
  return Object.entries(caps)
    .filter(([, on]) => on)
    .map(([k]) => k)
    .join(", ");
}

export default function PlanForm({
  plan,
  submitLabel,
  action,
}: {
  plan?: Plan;
  submitLabel: string;
  action: (prevState: PlanFormState, formData: FormData) => Promise<PlanFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AdminField label="Name" htmlFor="name" hint="For this console only — no visitor ever reads it.">
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={plan?.name ?? ""}
            className={fieldInputClass}
          />
        </AdminField>

        <AdminField label="Slug" htmlFor="slug" hint="Unique. Lowercase.">
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            defaultValue={plan?.slug ?? ""}
            className={fieldInputClass}
          />
        </AdminField>

        <AdminField label="Price" htmlFor="price">
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={plan?.price ?? 0}
            className={fieldInputClass}
          />
        </AdminField>

        <AdminField label="Currency" htmlFor="currency">
          <input
            id="currency"
            name="currency"
            type="text"
            defaultValue={plan?.currency ?? "MNT"}
            className={fieldInputClass}
          />
        </AdminField>

        <AdminField
          label="Billing period (days)"
          htmlFor="period_days"
          hint="30 for monthly, 365 for annual. Stored per plan, so an annual tier needs no code change."
        >
          <input
            id="period_days"
            name="period_days"
            type="number"
            min="1"
            step="1"
            defaultValue={plan?.period_days ?? 30}
            className={fieldInputClass}
          />
        </AdminField>

        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            step="1"
            defaultValue={plan?.sort_order ?? 0}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <AdminField
        label="Modules"
        htmlFor="modules"
        hint="Comma-separated, e.g. travel, carwash. WHICH PRODUCTS this plan grants. Leaving it empty does not grant nothing — it turns the module gate off entirely for everyone on this plan."
      >
        <input
          id="modules"
          name="modules"
          type="text"
          defaultValue={plan?.modules.join(", ") ?? ""}
          placeholder="travel, carwash"
          className={fieldInputClass}
        />
      </AdminField>

      <AdminField
        label="Limits"
        htmlFor="limits"
        hint='One "key = number" per line, e.g. locations = 3. An absent key means UNLIMITED, not zero. Zero is a real ceiling of none.'
      >
        <textarea
          id="limits"
          name="limits"
          rows={4}
          defaultValue={plan ? limitsToText(plan.limits) : ""}
          placeholder={"locations = 3\nstaff = 10"}
          className={fieldTextareaClass}
        />
      </AdminField>

      <AdminField
        label="Capabilities"
        htmlFor="capabilities"
        hint="Comma-separated on/off grants, e.g. custom_domain. Anything not listed is off."
      >
        <input
          id="capabilities"
          name="capabilities"
          type="text"
          defaultValue={plan ? capabilitiesToText(plan.capabilities) : ""}
          placeholder="custom_domain, priority_support"
          className={fieldInputClass}
        />
      </AdminField>

      <label className="flex items-center gap-2.5 label text-paper/70">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={plan?.is_active ?? true}
          className="accent-current"
        />
        Active — an inactive plan cannot be subscribed to, but tenants already on it keep it
      </label>

      <div className="flex items-center gap-4">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </ActionButton>
        {state.error && <p className="label text-accent">{state.error}</p>}
      </div>
    </form>
  );
}
