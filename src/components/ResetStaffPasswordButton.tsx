"use client";

import { useActionState } from "react";
import SecretOnce from "@/components/SecretOnce";
import type { PlatformFormState } from "@/lib/form-state";

// Reset button for one staff row. The generated password comes back in form
// state and is shown from component state only; nothing here clears it.
export default function ResetStaffPasswordButton({
  action,
  email,
}: {
  action: (prevState: PlatformFormState, formData: FormData) => Promise<PlatformFormState>;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="flex flex-col gap-2">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(`Reset the password for ${email}? A new one is generated and shown once.`)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="label text-paper/55 hover:text-accent transition-colors"
        >
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </form>
      {state.error && <p className="label text-accent">{state.error}</p>}
      {state.newKey && (
        <SecretOnce
          label={`New password for ${email} — copy it now`}
          value={state.newKey}
          hint="Copy it now, it cannot be recovered. Hand it over out of band and have them change it."
        />
      )}
    </div>
  );
}
