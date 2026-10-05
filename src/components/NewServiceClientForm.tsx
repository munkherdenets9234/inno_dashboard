"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import type { PlatformFormState } from "@/lib/form-state";

export default function NewServiceClientForm({
  action,
}: {
  action: (prevState: PlatformFormState, formData: FormData) => Promise<PlatformFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5 min-w-56">
        <label className="label text-paper/70" htmlFor="name">
          Register a service
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="carwash"
          className={fieldInputClass}
        />
        <span className="label text-paper/35">
          Use the service&apos;s own name. Its key goes in that service&apos;s TENANTCORE_SERVICE_KEY.
        </span>
      </div>
      <ActionButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Creating…" : "Create key"}
      </ActionButton>
      {state.error && <p className="label text-accent w-full">{state.error}</p>}
    </form>
  );
}
