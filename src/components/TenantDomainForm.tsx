"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import type { TenantIdentityState } from "@/lib/form-state";

export default function TenantDomainForm({
  domain,
  action,
}: {
  domain?: string;
  action: (prevState: TenantIdentityState, formData: FormData) => Promise<TenantIdentityState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-56">
        <label className="label text-paper/70" htmlFor="domain">
          Domain
        </label>
        <input
          id="domain"
          name="domain"
          type="text"
          defaultValue={domain ?? ""}
          placeholder="example.mn"
          className={fieldInputClass}
        />
        <span className="label text-paper/35">
          Binds this tenant&apos;s API key to one origin. Leave empty to accept it from anywhere.
        </span>
      </div>
      <ActionButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </ActionButton>
      {state.error && <p className="label text-accent w-full">{state.error}</p>}
      {state.saved && <p className="label text-paper/55 w-full">Saved.</p>}
    </form>
  );
}
