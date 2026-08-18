"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import MultiLangField from "@/components/MultiLangField";
import MultiLangListField from "@/components/MultiLangListField";
import type { PackageFormState } from "@/app/(dashboard)/packages/actions";
import type { Package } from "@/lib/types";

export default function PackageForm({
  pkg,
  action,
  submitLabel,
}: {
  pkg?: Package;
  action: (prevState: PackageFormState, formData: FormData) => Promise<PackageFormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-6">
        <label className="label text-paper/55 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked={pkg?.is_active ?? true} />
          Active
        </label>
        <label className="label text-paper/55 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="highlighted" defaultChecked={pkg?.highlighted} />
          Highlight
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Slug" htmlFor="slug" hint="lowercase, numbers, hyphens">
          <input id="slug" name="slug" defaultValue={pkg?.slug} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Sort order" htmlFor="sort_order">
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={pkg?.sort_order ?? 0}
            className={fieldInputClass}
          />
        </AdminField>
      </div>

      <MultiLangField name="name" label="Name" defaultValue={pkg?.name} />
      <MultiLangField name="tagline" label="Tagline" defaultValue={pkg?.tagline} />

      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Price" htmlFor="price">
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min={0}
            defaultValue={pkg?.price}
            className={fieldInputClass}
          />
        </AdminField>
        <AdminField label="Currency" htmlFor="currency">
          <input id="currency" name="currency" defaultValue={pkg?.currency} className={fieldInputClass} />
        </AdminField>
      </div>

      <MultiLangField name="billing_note" label="Billing note" defaultValue={pkg?.billing_note} />
      <MultiLangListField name="features" label="Features" defaultValue={pkg?.features} />

      {state.error && <p className="label text-accent">{state.error}</p>}

      <div className="flex items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </ActionButton>
        {state.saved && <span className="label text-paper/35">Saved.</span>}
      </div>
    </form>
  );
}
