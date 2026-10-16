"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { PaymentSettingsFormState } from "@/app/admin/(console)/settings/payment/actions";
import type { PaymentSettings } from "@/lib/types";

type Action = (prev: PaymentSettingsFormState, formData: FormData) => Promise<PaymentSettingsFormState>;

export default function PaymentSettingsForm({ settings, action }: { settings: PaymentSettings; action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  // After a successful save the page is revalidated, so `settings` is fresh.
  const configured = settings.configured;

  return (
    <form action={formAction} className="border border-paper/10 p-5 flex flex-col gap-5">
      <p className={`label ${configured ? "text-paper" : "text-accent"}`}>
        {configured
          ? `Configured${settings.updated_at ? ` · last saved ${settings.updated_at.slice(0, 10)}` : ""}`
          : "Not configured: invoices cannot be sent yet."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Company name" htmlFor="company_name" hint="The issuer shown in the invoice header and seller block">
          <input id="company_name" name="company_name" defaultValue={settings.company_name} maxLength={100} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Contact person (optional)" htmlFor="contact_person" hint="Shown as the person in charge under the seller">
          <input id="contact_person" name="contact_person" defaultValue={settings.contact_person} maxLength={100} className={fieldInputClass} />
        </AdminField>
        <div className="sm:col-span-2">
          <AdminField label="Company tagline (optional)" htmlFor="company_tagline" hint="One line under the company name, up to 150 characters">
            <input id="company_tagline" name="company_tagline" defaultValue={settings.company_tagline} maxLength={150} className={fieldInputClass} />
          </AdminField>
        </div>
        <AdminField label="Bank name" htmlFor="bank_name">
          <input id="bank_name" name="bank_name" defaultValue={settings.bank_name} maxLength={100} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Account name" htmlFor="account_name">
          <input id="account_name" name="account_name" defaultValue={settings.account_name} maxLength={100} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Account number" htmlFor="account_number" hint="4 to 34 letters, digits, spaces or hyphens (IBANs fit)">
          <input
            id="account_number"
            name="account_number"
            defaultValue={settings.account_number}
            minLength={4}
            maxLength={34}
            pattern="[A-Za-z0-9 \-]{4,34}"
            required
            className={fieldInputClass}
          />
        </AdminField>
        <AdminField label="SWIFT (optional)" htmlFor="swift" hint="8 or 11 letters or digits">
          <input id="swift" name="swift" defaultValue={settings.swift} maxLength={11} pattern="([A-Za-z0-9]{8}|[A-Za-z0-9]{11})?" className={fieldInputClass} />
        </AdminField>
      </div>
      <AdminField
        label="Instructions (optional)"
        htmlFor="instructions"
        hint="A short note shown under the bank details, up to 500 characters. Amounts are always in MNT."
      >
        <textarea id="instructions" name="instructions" defaultValue={settings.instructions} maxLength={500} rows={3} className={fieldTextareaClass} />
      </AdminField>
      {state.error && <p className="label text-accent">{state.error}</p>}
      {state.saved && <p className="label text-paper">Saved.</p>}
      <div>
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </ActionButton>
      </div>
    </form>
  );
}
