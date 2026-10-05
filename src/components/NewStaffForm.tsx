"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import type { PlatformFormState } from "@/lib/form-state";

export default function NewStaffForm({
  action,
}: {
  action: (prevState: PlatformFormState, formData: FormData) => Promise<PlatformFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5 min-w-48">
        <label className="label text-paper/70" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" type="text" className={fieldInputClass} />
      </div>
      <div className="flex flex-col gap-1.5 min-w-56">
        <label className="label text-paper/70" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className={fieldInputClass} />
      </div>
      <div className="flex flex-col gap-1.5 min-w-56">
        <label className="label text-paper/70" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          className={fieldInputClass}
        />
        <span className="label text-paper/35">Leave empty to have one generated and shown once.</span>
      </div>
      <ActionButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Creating…" : "Add"}
      </ActionButton>
      {state.error && <p className="label text-accent w-full">{state.error}</p>}
    </form>
  );
}
