"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { DomainFormState } from "@/app/admin/(console)/tenants/actions";
import type { PaymentMethod, PaymentStatus, SubdomainPurpose, TenantDomain, TenantSubdomain } from "@/lib/types";

type SaveAction = (domainId: string, prev: DomainFormState, formData: FormData) => Promise<DomainFormState>;
type RemoveAction = (domainId: string, prev: DomainFormState) => Promise<DomainFormState>;

const th = "label text-paper/35 font-normal px-4 py-3";
const td = "px-4 py-3 align-top";
const MAX_SUBDOMAINS = 50;
const PURPOSES: SubdomainPurpose[] = ["app", "api", "admin", "other"];

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const mnt = (n: number) => `${n.toLocaleString("en-US")} MNT`;
const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

// Status is derived by the server (paid through the expiry or not); shown read-only.
function StatusBadge({ label, status }: { label: string; status: PaymentStatus }) {
  const tone = status === "unpaid" ? "text-accent" : status === "paid" ? "text-paper" : "text-paper/35";
  return (
    <span className={`label block ${tone}`}>
      {label} {status}
    </span>
  );
}

export default function DomainsPanel({
  domains,
  save,
  remove,
}: {
  domains: TenantDomain[];
  save: SaveAction;
  remove: RemoveAction;
}) {
  // "" = closed, "new" = add form, otherwise the id being edited.
  const [editing, setEditing] = useState("");
  const current = domains.find((d) => d.id === editing);

  return (
    <div className="flex flex-col gap-6">
      {domains.length === 0 ? (
        <p className="label text-paper/35 border border-paper/10 px-4 py-3">No domains recorded for this tenant.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className={th}>Domain</th>
                <th className={th}>Owner</th>
                <th className={th}>Registrar</th>
                <th className={th}>Expires</th>
                <th className={th}>Payment</th>
                <th className={th}>DNS</th>
                <th className={th}>Subdomains</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-b border-paper/10 last:border-b-0">
                  <td className={td}>
                    {d.name}
                    {d.is_primary && <span className="label text-accent block mt-1">primary</span>}
                  </td>
                  <td className={`${td} text-paper/70`}>{d.registrant_owner || "—"}</td>
                  <td className={`${td} text-paper/70`}>{d.registrar || "—"}</td>
                  <td className={`${td} text-paper/70`}>{day(d.expires_at) || "—"}</td>
                  <td className={td}>
                    <StatusBadge label="client" status={d.payment.client_charge.status} />
                    <StatusBadge label="registrar" status={d.payment.registrar_cost.status} />
                    {d.payment.margin !== null && (
                      <span className="label text-paper/55 block">margin {mnt(d.payment.margin)}</span>
                    )}
                  </td>
                  <td className={td}>
                    <span className={`label ${d.dns_verified ? "text-paper" : "text-paper/35"}`}>
                      {d.dns_verified ? "verified" : "unverified"}
                    </span>
                  </td>
                  <td className={`${td} text-paper/70`}>{d.subdomains.length}</td>
                  <td className={td}>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setEditing(d.id)}
                        className="label text-paper/55 hover:text-accent transition-colors"
                      >
                        Edit
                      </button>
                      <DeleteControl name={d.name} action={remove.bind(null, d.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing === "" ? (
        <div>
          <ActionButton type="button" variant="outline" onClick={() => setEditing("new")}>
            Add domain
          </ActionButton>
        </div>
      ) : (
        <DomainForm
          // A fresh form per record, so one record's fields never leak into another's.
          key={editing}
          domain={current}
          action={save.bind(null, current ? current.id : "")}
          onDone={() => setEditing("")}
        />
      )}
    </div>
  );
}

function DeleteControl({ name, action }: { name: string; action: (prev: DomainFormState) => Promise<DomainFormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="label text-paper/35 hover:text-accent transition-colors"
        >
          Delete
        </button>
      ) : (
        <>
          <p className="text-sm text-paper/70">Delete the record for {name}? This does not change DNS or routing.</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Deleting…" : "Yes, delete"}
            </ActionButton>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="label text-paper/55 hover:text-paper transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 label text-paper/70">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function DomainForm({
  domain,
  action,
  onDone,
}: {
  domain?: TenantDomain;
  action: (prev: DomainFormState, formData: FormData) => Promise<DomainFormState>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: DomainFormState, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.saved) onDone();
      return next;
    },
    {},
  );
  const [subs, setSubs] = useState<TenantSubdomain[]>(domain?.subdomains ?? []);
  const dep = domain?.deployment;
  const cc = domain?.payment.client_charge;
  const rc = domain?.payment.registrar_cost;

  function patchSub(i: number, patch: Partial<TenantSubdomain>) {
    setSubs((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  return (
    <form action={formAction} className="border border-paper/10 p-5 flex flex-col gap-6">
      <h2 className="label text-paper/70">{domain ? `Edit ${domain.name}` : "Add domain"}</h2>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Domain name" htmlFor="name" hint="e.g. example.mn — no scheme, port or path">
          <input id="name" name="name" defaultValue={domain?.name} maxLength={253} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Expires" htmlFor="expires_at">
          <input id="expires_at" name="expires_at" type="date" defaultValue={day(domain?.expires_at ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Registrant name" htmlFor="registrant_name">
          <input id="registrant_name" name="registrant_name" defaultValue={domain?.registrant_name} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Registrant owner" htmlFor="registrant_owner">
          <select id="registrant_owner" name="registrant_owner" defaultValue={domain?.registrant_owner ?? ""} className={fieldInputClass}>
            <option value="">Not set</option>
            <option value="us">Us</option>
            <option value="client">Client</option>
          </select>
        </AdminField>
        <AdminField label="Registrar" htmlFor="registrar">
          <input id="registrar" name="registrar" defaultValue={domain?.registrar} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Registrar account email" htmlFor="registrar_account_email">
          <input id="registrar_account_email" name="registrar_account_email" type="email" defaultValue={domain?.registrar_account_email} maxLength={254} className={fieldInputClass} />
        </AdminField>
        <AdminField label="DNS provider" htmlFor="dns_provider">
          <input id="dns_provider" name="dns_provider" defaultValue={domain?.dns_provider} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="DNS provider email" htmlFor="dns_provider_email">
          <input id="dns_provider_email" name="dns_provider_email" type="email" defaultValue={domain?.dns_provider_email} maxLength={254} className={fieldInputClass} />
        </AdminField>
        <AdminField label="DNS last checked" htmlFor="dns_checked_at">
          <input id="dns_checked_at" name="dns_checked_at" type="date" defaultValue={day(domain?.dns_checked_at ?? null)} className={fieldInputClass} />
        </AdminField>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 self-end h-10">
          <Check name="is_primary" label="Primary" defaultChecked={domain?.is_primary} />
          <Check name="auto_renew" label="Auto-renew" defaultChecked={domain?.auto_renew} />
          <Check name="registrar_lock" label="Registrar lock" defaultChecked={domain?.registrar_lock} />
          <Check name="dns_verified" label="DNS verified" defaultChecked={domain?.dns_verified} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="label text-paper/70 mb-1">Subdomains ({subs.length}/{MAX_SUBDOMAINS})</legend>
        {subs.map((s, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_8rem_1fr_8rem_auto] items-center">
            <input aria-label="Subdomain name" placeholder="app or app.example.mn" value={s.name} maxLength={253}
              onChange={(e) => patchSub(i, { name: e.target.value })} className={fieldInputClass} />
            <select aria-label="Purpose" value={s.purpose} onChange={(e) => patchSub(i, { purpose: e.target.value as SubdomainPurpose })} className={fieldInputClass}>
              {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input aria-label="Target" placeholder="Target" value={s.target} maxLength={200}
              onChange={(e) => patchSub(i, { target: e.target.value })} className={fieldInputClass} />
            <input aria-label="Status" placeholder="Status" value={s.status} maxLength={64}
              onChange={(e) => patchSub(i, { status: e.target.value })} className={fieldInputClass} />
            <button type="button" onClick={() => setSubs((x) => x.filter((_, j) => j !== i))}
              className="label text-paper/35 hover:text-accent transition-colors">
              Remove
            </button>
          </div>
        ))}
        {subs.length < MAX_SUBDOMAINS && (
          <div>
            <button type="button" onClick={() => setSubs((x) => [...x, { name: "", purpose: "app", target: "", status: "" }])}
              className="label text-paper/55 hover:text-accent transition-colors">
              Add subdomain
            </button>
          </div>
        )}
        <input type="hidden" name="subdomains" value={JSON.stringify(subs)} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="label text-paper/70 mb-3">Deployment</legend>
        <AdminField label="Provider" htmlFor="deployment_provider">
          <input id="deployment_provider" name="deployment_provider" defaultValue={dep?.provider} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Provider email" htmlFor="deployment_provider_email">
          <input id="deployment_provider_email" name="deployment_provider_email" type="email" defaultValue={dep?.provider_email} maxLength={254} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Environment" htmlFor="deployment_environment">
          <select id="deployment_environment" name="deployment_environment" defaultValue={dep?.environment ?? ""} className={fieldInputClass}>
            <option value="">Not set</option>
            <option value="prod">Production</option>
            <option value="staging">Staging</option>
          </select>
        </AdminField>
        <AdminField label="Region" htmlFor="deployment_region">
          <input id="deployment_region" name="deployment_region" defaultValue={dep?.region} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Resource ID" htmlFor="deployment_resource_id" hint="An identifier, never a secret">
          <input id="deployment_resource_id" name="deployment_resource_id" defaultValue={dep?.resource_id} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Address" htmlFor="deployment_address">
          <input id="deployment_address" name="deployment_address" defaultValue={dep?.address} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="DNS target" htmlFor="deployment_dns_target">
          <input id="deployment_dns_target" name="deployment_dns_target" defaultValue={dep?.dns_target} maxLength={200} className={fieldInputClass} />
        </AdminField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="label text-paper/70 mb-3">Payment</legend>
        <p className="label text-paper/35 sm:col-span-2">
          A part is paid when its paid-through date is on or after the expiry date; renewing the domain makes it unpaid
          again. Status is worked out by the server.
          {domain && (
            <>
              {" "}Now: client {domain.payment.client_charge.status}, registrar {domain.payment.registrar_cost.status}.
            </>
          )}
        </p>
        <h3 className="label text-paper/55 sm:col-span-2">Client charge (what we bill the client)</h3>
        <AdminField label="Amount (MNT)" htmlFor="client_amount" hint="Whole MNT; 0 means none">
          <input id="client_amount" name="client_amount" type="number" min={0} step={1} defaultValue={cc?.amount ?? 0} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Method" htmlFor="client_method">
          <select id="client_method" name="client_method" defaultValue={cc?.method ?? ""} className={fieldInputClass}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </AdminField>
        <AdminField label="Paid on" htmlFor="client_paid_at">
          <input id="client_paid_at" name="client_paid_at" type="date" defaultValue={day(cc?.paid_at ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Paid through" htmlFor="client_paid_through" hint="The date the paid period covers up to">
          <input id="client_paid_through" name="client_paid_through" type="date" defaultValue={day(cc?.paid_through ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Reference" htmlFor="client_reference" hint="Receipt or transfer number, never a card number" className="sm:col-span-2">
          <input id="client_reference" name="client_reference" defaultValue={cc?.reference} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <h3 className="label text-paper/55 sm:col-span-2">Registrar cost (what the registrar charges)</h3>
        <AdminField label="Amount (MNT)" htmlFor="registrar_amount" hint="Whole MNT; 0 means none">
          <input id="registrar_amount" name="registrar_amount" type="number" min={0} step={1} defaultValue={rc?.amount ?? 0} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Paid by" htmlFor="registrar_payer">
          <select id="registrar_payer" name="registrar_payer" defaultValue={rc?.payer ?? ""} className={fieldInputClass}>
            <option value="">Not set</option>
            <option value="us">Us</option>
            <option value="client">Client</option>
          </select>
        </AdminField>
        <AdminField label="Paid on" htmlFor="registrar_paid_at">
          <input id="registrar_paid_at" name="registrar_paid_at" type="date" defaultValue={day(rc?.paid_at ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Paid through" htmlFor="registrar_paid_through" hint="The date the paid period covers up to">
          <input id="registrar_paid_through" name="registrar_paid_through" type="date" defaultValue={day(rc?.paid_through ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Method" htmlFor="registrar_method">
          <select id="registrar_method" name="registrar_method" defaultValue={rc?.method ?? ""} className={fieldInputClass}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </AdminField>
        <AdminField label="Reference" htmlFor="registrar_reference">
          <input id="registrar_reference" name="registrar_reference" defaultValue={rc?.reference} maxLength={200} className={fieldInputClass} />
        </AdminField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="label text-paper/70 mb-3">SSL and contacts</legend>
        <AdminField label="SSL provider" htmlFor="ssl_provider">
          <input id="ssl_provider" name="ssl_provider" defaultValue={domain?.ssl_provider} maxLength={200} className={fieldInputClass} />
        </AdminField>
        <AdminField label="SSL expires" htmlFor="ssl_expires_at">
          <input id="ssl_expires_at" name="ssl_expires_at" type="date" defaultValue={day(domain?.ssl_expires_at ?? null)} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Technical contact email" htmlFor="tech_contact_email">
          <input id="tech_contact_email" name="tech_contact_email" type="email" defaultValue={domain?.tech_contact_email} maxLength={254} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Billing contact email" htmlFor="billing_contact_email">
          <input id="billing_contact_email" name="billing_contact_email" type="email" defaultValue={domain?.billing_contact_email} maxLength={254} className={fieldInputClass} />
        </AdminField>
        <AdminField label="Notes" htmlFor="notes" hint="No passwords or keys" className="sm:col-span-2">
          <textarea id="notes" name="notes" rows={3} defaultValue={domain?.notes} maxLength={2000} className={fieldTextareaClass} />
        </AdminField>
      </fieldset>

      {state.error && <p className="label text-accent">{state.error}</p>}
      <div className="flex items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : domain ? "Save changes" : "Add domain"}
        </ActionButton>
        <button type="button" onClick={onDone} disabled={pending}
          className="label text-paper/55 hover:text-paper transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
