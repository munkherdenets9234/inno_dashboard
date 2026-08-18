"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import type { AssignPackageFormState } from "@/app/(dashboard)/tenants/actions";
import type { Package } from "@/lib/types";

export default function AssignPackageForm({
  options,
  action,
}: {
  options: Package[];
  action: (prevState: AssignPackageFormState, formData: FormData) => Promise<AssignPackageFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  if (options.length === 0) {
    return <p className="label text-paper/35">Every catalog package is already assigned.</p>;
  }

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5">
        <label className="label text-paper/70" htmlFor="package_id">
          Assign a package
        </label>
        <select id="package_id" name="package_id" className={fieldInputClass}>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.en || p.slug}
            </option>
          ))}
        </select>
      </div>
      <ActionButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Assigning…" : "Assign"}
      </ActionButton>
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}
