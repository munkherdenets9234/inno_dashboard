"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import type { CreateTenantState } from "@/lib/form-state";

export default function NewTenantForm({
  action,
}: {
  action: (prevState: CreateTenantState, formData: FormData) => Promise<CreateTenantState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      <AdminField label="Name" htmlFor="name" hint="Brand or display name, as the tenant writes it.">
        <input id="name" name="name" type="text" required className={fieldInputClass} />
      </AdminField>

      <AdminField
        label="Slug"
        htmlFor="slug"
        hint="Lowercase, URL-safe, unique across the platform. It appears in product URLs and is not worth changing later."
      >
        <input
          id="slug"
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          className={fieldInputClass}
        />
      </AdminField>

      <AdminField label="Contact email" htmlFor="contact_email">
        <input id="contact_email" name="contact_email" type="email" className={fieldInputClass} />
      </AdminField>

      <AdminField
        label="Domain"
        htmlFor="domain"
        hint="Optional. Binds the tenant's API key to one origin; can be set later."
      >
        <input id="domain" name="domain" type="text" placeholder="example.mn" className={fieldInputClass} />
      </AdminField>

      <div className="flex items-center gap-4">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create tenant"}
        </ActionButton>
        <span className="label text-paper/35">The API key is shown once, on the next screen.</span>
      </div>

      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}
