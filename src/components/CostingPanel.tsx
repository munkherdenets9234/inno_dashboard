"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { CostingFormState, InvoicePreviewState, InvoiceStep } from "@/app/admin/(console)/tenants/actions";
import type {
  FeeInterval,
  FeeKind,
  Invoice,
  InvoicePayMethod,
  TenantCosting,
  TenantDomain,
  TenantFeeCosting,
} from "@/lib/types";
import { invoiceLineKey } from "@/lib/types";

type SaveFee = (feeId: string, prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;
type DeleteFee = (feeId: string, prev: CostingFormState) => Promise<CostingFormState>;
type CreateInvoice = (prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;
type InvoiceStepAction = (invoiceId: string, step: InvoiceStep) => Promise<CostingFormState>;
type DeleteInvoice = (invoiceId: string, prev: CostingFormState) => Promise<CostingFormState>;
type EditInvoice = (invoiceId: string, prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;
type MarkPaid = (invoiceId: string, total: number, prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;
type PreviewInvoice = (invoiceId: string) => Promise<InvoicePreviewState>;
type MarkRegistrarPaid = (domainId: string) => Promise<CostingFormState>;

const th = "label text-paper/35 font-normal px-4 py-3";
const td = "px-4 py-3 align-top";
const linkBtn = "label text-paper/55 hover:text-accent transition-colors";

const KINDS: FeeKind[] = ["domain", "deployment", "other"];
const INTERVALS: { value: FeeInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One time" },
];

const PAY_METHODS: { value: InvoicePayMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];
const methodLabel = (m: string) => PAY_METHODS.find((p) => p.value === m)?.label ?? m;
const NOT_CONFIGURED = "Payment settings are not configured";

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const mnt = (n: number) => `${n.toLocaleString("en-US")} MNT`;
const percent = (bp: number) => `${bp / 100}%`;

// ── Line discounts ────────────────────────────────────────────────────────
//
// The operator picks a type (MNT amount or percent), a number and an optional
// reason per line. The figures shown here are an estimate with the server's
// rounding; the server computes and stores the real discount and totals.

type DiscountType = "amount" | "percent";
interface DiscountDraft {
  type: DiscountType;
  value: string;
  reason: string;
}
const NO_DISCOUNT: DiscountDraft = { type: "amount", value: "", reason: "" };

// The discount of a line of the given gross amount, clamped to 0..gross. An
// unreadable value counts as no discount.
function discountEstimate(gross: number, d: DiscountDraft): number {
  const raw = d.value.trim();
  if (raw === "") return 0;
  if (d.type === "percent") {
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw)) return 0;
    const bp = Math.round(Number(raw) * 100);
    if (bp > 10000) return 0;
    return Math.min(gross, Math.floor((gross * bp + 5000) / 10000));
  }
  if (!/^\d{1,13}$/.test(raw)) return 0;
  return Math.min(gross, Number(raw));
}

// A value the server would refuse: shown as a hint, never blocks submitting.
function discountProblem(gross: number, d: DiscountDraft): string {
  const raw = d.value.trim();
  if (raw === "") return "";
  if (d.type === "percent") {
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw) || Number(raw) > 100) return "Percent from 0 to 100";
    return "";
  }
  if (!/^\d{1,13}$/.test(raw)) return "Whole MNT, 0 or more";
  return Number(raw) > gross ? "More than the line" : "";
}

// Estimated totals: tax is on the discounted base, as on the server.
function estimateTotals(rows: { gross: number; draft: DiscountDraft }[], taxRaw: string) {
  const gross = rows.reduce((s, r) => s + r.gross, 0);
  const discount = rows.reduce((s, r) => s + discountEstimate(r.gross, r.draft), 0);
  const base = gross - discount;
  const raw = taxRaw.trim();
  const bp = /^\d{1,3}(\.\d{1,2})?$/.test(raw) && Number(raw) <= 100 ? Math.round(Number(raw) * 100) : 0;
  const tax = Math.floor((base * bp + 5000) / 10000);
  return { gross, discount, tax, total: base + tax };
}

function TotalsPreview({ rows, taxRaw }: { rows: { gross: number; draft: DiscountDraft }[]; taxRaw: string }) {
  const t = estimateTotals(rows, taxRaw);
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm self-end min-w-60" aria-label="Totals preview">
      <dt className="text-paper/55">Subtotal (gross)</dt>
      <dd className="text-right">{mnt(t.gross)}</dd>
      {t.discount > 0 && (
        <>
          <dt className="text-paper/55">Discount</dt>
          <dd className="text-right">−{mnt(t.discount)}</dd>
        </>
      )}
      {t.tax > 0 && (
        <>
          <dt className="text-paper/55">Tax</dt>
          <dd className="text-right">{mnt(t.tax)}</dd>
        </>
      )}
      <dt className="label text-paper/70">Total (estimate)</dt>
      <dd className="text-right">{mnt(t.total)}</dd>
    </dl>
  );
}

// One line's discount controls. The inputs are named by the line id so the
// action can read them; the net next to them is the live estimate.
function DiscountControl({
  id,
  gross,
  draft,
  onChange,
}: {
  id: string;
  gross: number;
  draft: DiscountDraft;
  onChange: (next: DiscountDraft) => void;
}) {
  const discount = discountEstimate(gross, draft);
  const problem = discountProblem(gross, draft);
  const typeBtn = (type: DiscountType, text: string, label: string) => (
    <button
      type="button"
      aria-pressed={draft.type === type}
      aria-label={label}
      onClick={() => onChange({ ...draft, type })}
      className={`label px-2 py-1 border ${draft.type === type ? "border-accent text-accent" : "border-paper/15 text-paper/55"}`}
    >
      {text}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 pl-7 text-sm">
      <span className="label text-paper/35">Discount</span>
      <input type="hidden" name={`disc_type_${id}`} value={draft.type} />
      {typeBtn("amount", "₮", "Discount in MNT")}
      {typeBtn("percent", "%", "Discount in percent")}
      <input
        name={`disc_value_${id}`}
        value={draft.value}
        onChange={(e) => onChange({ ...draft, value: e.target.value })}
        inputMode="decimal"
        maxLength={14}
        placeholder={draft.type === "percent" ? "e.g. 10" : "MNT"}
        aria-label={draft.type === "percent" ? "Discount percent" : "Discount amount in MNT"}
        className={`${fieldInputClass} w-28 py-1`}
      />
      <input
        name={`disc_reason_${id}`}
        value={draft.reason}
        onChange={(e) => onChange({ ...draft, reason: e.target.value })}
        maxLength={100}
        placeholder="Reason (optional)"
        aria-label="Discount reason"
        className={`${fieldInputClass} w-44 py-1`}
      />
      {problem ? (
        <span className="label text-accent">{problem}</span>
      ) : (
        <span className="text-paper/55">{discount > 0 ? `−${mnt(discount)} · net ${mnt(gross - discount)}` : ""}</span>
      )}
    </div>
  );
}

export default function CostingPanel({
  costing,
  invoices,
  domains,
  nowIso,
  saveFee,
  deleteFee,
  createInvoice,
  invoiceStep,
  editInvoice,
  deleteInvoice,
  markPaid,
  previewInvoice,
  paymentConfigured,
  markRegistrarPaid,
}: {
  costing: TenantCosting;
  invoices: Invoice[];
  domains: TenantDomain[];
  // Computed once on the server so the overdue/due-soon text matches on hydration.
  nowIso: string;
  saveFee: SaveFee;
  deleteFee: DeleteFee;
  createInvoice: CreateInvoice;
  invoiceStep: InvoiceStepAction;
  editInvoice: EditInvoice;
  deleteInvoice: DeleteInvoice;
  markPaid: MarkPaid;
  previewInvoice: PreviewInvoice;
  // False until our bank details are saved; sending is then blocked.
  paymentConfigured: boolean;
  markRegistrarPaid: MarkRegistrarPaid;
}) {
  return (
    <div className="flex flex-col gap-10">
      <DomainPayments costing={costing} markRegistrarPaid={markRegistrarPaid} />
      <FeesSection costing={costing} domains={domains} nowIso={nowIso} saveFee={saveFee} deleteFee={deleteFee} />
      <InvoiceBuilder costing={costing} createInvoice={createInvoice} />
      <InvoiceList invoices={invoices} invoiceStep={invoiceStep} editInvoice={editInvoice} deleteInvoice={deleteInvoice} markPaid={markPaid} previewInvoice={previewInvoice} paymentConfigured={paymentConfigured} nowIso={nowIso} />
    </div>
  );
}

function DueBadge({ due, nextDueAt, nowIso }: { due: boolean; nextDueAt: string | null; nowIso: string }) {
  if (!due) return null;
  const overdue = !!nextDueAt && day(nextDueAt) < day(nowIso);
  return <span className="label text-accent block mt-1">{overdue ? "overdue" : "due soon"}</span>;
}

// ── Domain payments ───────────────────────────────────────────────────────
//
// Both sides of the domain money. Client charges are billed through the
// invoice builder below; registrar costs are ours to pay and never go on an
// invoice. Amounts and statuses are the server's.

function DomainPayments({ costing, markRegistrarPaid }: { costing: TenantCosting; markRegistrarPaid: MarkRegistrarPaid }) {
  const p = costing.payables;
  const unpaid = [
    ...costing.domain_lines
      .filter((l) => l.payment_status === "unpaid")
      .map((l) => ({ id: l.id, name: l.domain_name, amount: l.amount, expires: l.next_due_at })),
    ...costing.fees
      .filter((f) => f.payment_status === "unpaid" && f.active)
      .map((f) => ({ id: f.id, name: f.domain_name ?? f.label, amount: f.amount, expires: f.next_due_at })),
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="label text-paper/70">Domain payments</h2>
        <p className="label text-paper/55">
          To receive from clients: <span className="text-paper">{mnt(p.receivable_total)}</span>
          {" · "}
          To pay registrars: <span className="text-paper">{mnt(p.payable_total)}</span>
        </p>
      </div>

      <h3 className="label text-paper/55">Unpaid domain payments</h3>
      {unpaid.length === 0 ? (
        <p className="label text-paper/35 border border-paper/10 px-4 py-3">No unpaid client charges. They are preselected in the invoice builder when there are.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className={th}>Domain</th>
                <th className={th}>Expires</th>
                <th className={th}>Client charge</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.map((u) => (
                <tr key={u.id} className="border-b border-paper/10 last:border-b-0">
                  <td className={td}>{u.name}</td>
                  <td className={`${td} text-paper/70`}>{day(u.expires) || "—"}</td>
                  <td className={td}>{mnt(u.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="label text-paper/55">Registrar payables</h3>
      {p.items.length === 0 ? (
        <p className="label text-paper/35 border border-paper/10 px-4 py-3">No unpaid registrar costs.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className={th}>Domain</th>
                <th className={th}>Expires</th>
                <th className={th}>Registrar cost</th>
                <th className={th}>Paid by</th>
                <th className={th}>Margin</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {p.items.map((i) => (
                <tr key={i.domain_id} className="border-b border-paper/10 last:border-b-0">
                  <td className={td}>{i.domain_name}</td>
                  <td className={`${td} text-paper/70`}>{day(i.expires_at) || "—"}</td>
                  <td className={td}>{mnt(i.amount)}</td>
                  <td className={`${td} text-paper/70`}>{i.payer || "—"}</td>
                  <td className={`${td} text-paper/70`}>{i.margin === null ? "—" : mnt(i.margin)}</td>
                  <td className={td}>
                    <StepButton
                      label="Mark registrar paid"
                      confirmText={`Mark the registrar cost of ${i.domain_name} (${mnt(i.amount)}) as paid through its expiry date? This does not create an invoice.`}
                      action={markRegistrarPaid.bind(null, i.domain_id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Fees ──────────────────────────────────────────────────────────────────

function FeesSection({
  costing,
  domains,
  nowIso,
  saveFee,
  deleteFee,
}: {
  costing: TenantCosting;
  domains: TenantDomain[];
  nowIso: string;
  saveFee: SaveFee;
  deleteFee: DeleteFee;
}) {
  // "" = closed, "new" = add form, otherwise the id being edited.
  const [editing, setEditing] = useState("");
  const current = costing.fees.find((f) => f.id === editing);
  const sub = costing.subscription;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="label text-paper/70">Fees</h2>
        <p className="label text-paper/55">
          Due within {costing.lead_days} days: <span className="text-paper">{mnt(costing.due_total)}</span>
        </p>
      </div>

      <div className="border border-paper/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper/10 text-left">
              <th className={th}>Fee</th>
              <th className={th}>Kind</th>
              <th className={th}>Amount</th>
              <th className={th}>Interval</th>
              <th className={th}>Next due</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {sub && (
              <tr className="border-b border-paper/10">
                <td className={td}>
                  {sub.label}
                  <span className="label text-paper/35 block mt-1">from the plan, not editable here</span>
                </td>
                <td className={`${td} text-paper/70`}>subscription</td>
                <td className={td}>{mnt(sub.amount)}</td>
                <td className={`${td} text-paper/70`}>per period</td>
                <td className={td}>
                  <span className="text-paper/70">{day(sub.next_due_at) || "—"}</span>
                  <DueBadge due={sub.due} nextDueAt={sub.next_due_at} nowIso={nowIso} />
                </td>
                <td className={td}></td>
              </tr>
            )}
            {costing.fees.map((f) => (
              <tr key={f.id} className="border-b border-paper/10 last:border-b-0">
                <td className={td}>
                  {f.label}
                  {f.domain_name && <span className="label text-paper/35 block mt-1">{f.domain_name}</span>}
                  {!f.active && <span className="label text-paper/35 block mt-1">inactive</span>}
                  {f.payment_status === "unpaid" && <span className="label text-accent block mt-1">client charge unpaid</span>}
                </td>
                <td className={`${td} text-paper/70`}>{f.kind}</td>
                <td className={td}>{mnt(f.amount)}</td>
                <td className={`${td} text-paper/70`}>{f.interval.replace("_", " ")}</td>
                <td className={td}>
                  <span className="text-paper/70">{day(f.next_due_at) || "—"}</span>
                  <DueBadge due={f.due} nextDueAt={f.next_due_at} nowIso={nowIso} />
                </td>
                <td className={td}>
                  <div className="flex items-start gap-4">
                    <button type="button" onClick={() => setEditing(f.id)} className={linkBtn}>
                      Edit
                    </button>
                    <DeleteFeeControl label={f.label} action={deleteFee.bind(null, f.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {!sub && costing.fees.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} label text-paper/35`}>
                  No fees recorded and no subscription for this tenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing === "" ? (
        <div>
          <ActionButton type="button" variant="outline" onClick={() => setEditing("new")}>
            Add fee
          </ActionButton>
        </div>
      ) : (
        <FeeForm
          // A fresh form per record, so one record's fields never leak into another's.
          key={editing}
          fee={current}
          domains={domains}
          action={saveFee.bind(null, current ? current.id : "")}
          onDone={() => setEditing("")}
        />
      )}
    </section>
  );
}

function DeleteFeeControl({ label, action }: { label: string; action: (prev: CostingFormState) => Promise<CostingFormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="label text-paper/35 hover:text-accent transition-colors">
          Delete
        </button>
      ) : (
        <>
          <p className="text-sm text-paper/70">Delete the fee “{label}”? Invoices already made keep their lines.</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Deleting…" : "Yes, delete"}
            </ActionButton>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="label text-paper/55 hover:text-paper transition-colors">
              Cancel
            </button>
          </div>
        </>
      )}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}

function FeeForm({
  fee,
  domains,
  action,
  onDone,
}: {
  fee?: TenantFeeCosting;
  domains: TenantDomain[];
  action: (prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: CostingFormState, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.saved) onDone();
      return next;
    },
    {},
  );
  const [kind, setKind] = useState<FeeKind>(fee?.kind ?? "other");

  return (
    <form action={formAction} className="border border-paper/10 p-5 flex flex-col gap-5">
      <h3 className="label text-paper/70">{fee ? `Edit ${fee.label}` : "Add fee"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Kind" htmlFor="kind">
          <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as FeeKind)} className={fieldInputClass}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Label" htmlFor="label">
          <input id="label" name="label" defaultValue={fee?.label} maxLength={200} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Amount (MNT)" htmlFor="amount" hint="Whole MNT, no decimals">
          <input id="amount" name="amount" type="number" min={0} step={1} defaultValue={fee?.amount ?? 0} required className={fieldInputClass} />
        </AdminField>
        <AdminField label="Interval" htmlFor="interval">
          <select id="interval" name="interval" defaultValue={fee?.interval ?? "yearly"} className={fieldInputClass}>
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </AdminField>
        {kind === "domain" && (
          <AdminField label="Domain" htmlFor="domain_id" hint="Due when this domain expires">
            <select id="domain_id" name="domain_id" defaultValue={fee?.domain_id ?? ""} required className={fieldInputClass}>
              <option value="">Choose a domain</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.expires_at ? ` (expires ${day(d.expires_at)})` : ""}</option>
              ))}
            </select>
          </AdminField>
        )}
        {kind !== "domain" && (
          <AdminField label="Last invoiced through" htmlFor="last_invoiced_through" hint="Next due is one interval after this. Leave blank to keep it.">
            <input id="last_invoiced_through" name="last_invoiced_through" type="date" defaultValue={day(fee?.last_invoiced_through ?? null)} className={fieldInputClass} />
          </AdminField>
        )}
        <label className="flex items-center gap-2 label text-paper/70 self-end h-10">
          <input type="checkbox" name="active" defaultChecked={fee ? fee.active : true} />
          Active
        </label>
      </div>
      {state.error && <p className="label text-accent">{state.error}</p>}
      <div className="flex items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Saving…" : fee ? "Save changes" : "Add fee"}
        </ActionButton>
        <button type="button" onClick={onDone} disabled={pending} className="label text-paper/55 hover:text-paper transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Invoice builder ───────────────────────────────────────────────────────

interface Candidate {
  id: string;
  label: string;
  amount: number;
  due: boolean;
  nextDueAt: string | null;
  // Number of the live invoice already billing this period; the line is then
  // not selectable (the server would answer 409).
  invoicedOn?: string;
}

function InvoiceBuilder({ costing, createInvoice }: { costing: TenantCosting; createInvoice: CreateInvoice }) {
  const candidates: Candidate[] = [];
  const sub = costing.subscription;
  if (sub && sub.status !== "canceled" && sub.next_due_at) {
    candidates.push({ id: sub.id, label: sub.label, amount: sub.amount, due: sub.due, nextDueAt: sub.next_due_at, invoicedOn: sub.invoiced_on });
  }
  for (const f of costing.fees) {
    // An unpaid domain charge is due now even when the domain has no expiry.
    if (f.active && (f.next_due_at || f.due)) {
      candidates.push({ id: f.id, label: f.label, amount: f.amount, due: f.due, nextDueAt: f.next_due_at, invoicedOn: f.invoiced_on });
    }
  }
  for (const l of costing.domain_lines) {
    if (l.next_due_at || l.due) {
      candidates.push({ id: l.id, label: l.label, amount: l.amount, due: l.due, nextDueAt: l.next_due_at, invoicedOn: l.invoiced_on });
    }
  }

  // Due lines are preselected; the rest can be ticked to invoice early.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(candidates.filter((c) => c.due && !c.invoicedOn).map((c) => c.id)));
  const [state, formAction, pending] = useActionState(createInvoice, {});
  const [drafts, setDrafts] = useState<Record<string, DiscountDraft>>({});
  const [taxRaw, setTaxRaw] = useState("");
  const draftOf = (id: string) => drafts[id] ?? NO_DISCOUNT;
  const chosen = candidates.filter((c) => !c.invoicedOn && selected.has(c.id));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="label text-paper/70">New invoice</h2>
      {candidates.length === 0 ? (
        <p className="label text-paper/35 border border-paper/10 px-4 py-3">Nothing to invoice: no active line has a due date.</p>
      ) : (
        <form action={formAction} className="border border-paper/10 p-5 flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="label text-paper/70 mb-2">Lines</legend>
            {candidates.map((c) => {
              const isChosen = !c.invoicedOn && selected.has(c.id);
              const d = draftOf(c.id);
              const off = discountEstimate(c.amount, d);
              return (
                <div key={c.id} className="flex flex-col gap-2">
                  <label className={`flex items-center gap-3 text-sm ${c.invoicedOn ? "opacity-60" : ""}`}>
                    <input
                      type="checkbox"
                      name="fee_ids"
                      value={c.id}
                      checked={isChosen}
                      disabled={!!c.invoicedOn}
                      onChange={() => toggle(c.id)}
                    />
                    <span className="flex-1">{c.label}</span>
                    {c.invoicedOn && <span className="label text-accent">on {c.invoicedOn}</span>}
                    <span className="text-paper/55">{day(c.nextDueAt) || "no expiry"}{c.due ? " · due" : ""}</span>
                    <span className={off > 0 ? "text-paper/35 line-through" : ""}>{mnt(c.amount)}</span>
                    {off > 0 && <span>{mnt(c.amount - off)}</span>}
                  </label>
                  {/* Only selected lines post a discount, so none can name an unselected line. */}
                  {isChosen && (
                    <DiscountControl id={c.id} gross={c.amount} draft={d} onChange={(next) => setDrafts((all) => ({ ...all, [c.id]: next }))} />
                  )}
                </div>
              );
            })}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Tax rate (%)" htmlFor="tax_rate" hint="Optional, e.g. 10 or 8.25. Totals are calculated by the server.">
              <input
                id="tax_rate"
                name="tax_rate"
                inputMode="decimal"
                placeholder="No tax"
                maxLength={6}
                value={taxRaw}
                onChange={(e) => setTaxRaw(e.target.value)}
                className={fieldInputClass}
              />
            </AdminField>
            <AdminField label="Due date" htmlFor="due_at" hint="Optional">
              <input id="due_at" name="due_at" type="date" className={fieldInputClass} />
            </AdminField>
          </div>
          <TotalsPreview rows={chosen.map((c) => ({ gross: c.amount, draft: draftOf(c.id) }))} taxRaw={taxRaw} />
          {state.error && <p className="label text-accent">{state.error}</p>}
          <div>
            <ActionButton type="submit" disabled={pending || candidates.every((c) => c.invoicedOn || !selected.has(c.id))}>
              {pending ? "Creating…" : "Create draft invoice"}
            </ActionButton>
          </div>
        </form>
      )}
    </section>
  );
}

// ── Invoices ──────────────────────────────────────────────────────────────

function InvoiceList({
  invoices,
  invoiceStep,
  editInvoice,
  deleteInvoice,
  markPaid,
  previewInvoice,
  paymentConfigured,
  nowIso,
}: {
  invoices: Invoice[];
  invoiceStep: InvoiceStepAction;
  editInvoice: EditInvoice;
  deleteInvoice: DeleteInvoice;
  markPaid: MarkPaid;
  previewInvoice: PreviewInvoice;
  paymentConfigured: boolean;
  nowIso: string;
}) {
  const [preview, setPreview] = useState<{ id: string; number: string; loading: boolean; error?: string; subject?: string; html?: string } | null>(null);
  const openPreview = async (inv: Invoice) => {
    setPreview({ id: inv.id, number: inv.number, loading: true });
    const res = await previewInvoice(inv.id);
    // Ignore a late answer when another invoice was opened or the panel closed.
    setPreview((cur) => (cur && cur.id === inv.id ? { id: inv.id, number: inv.number, loading: false, ...res } : cur));
  };
  return (
    <section className="flex flex-col gap-4">
      <h2 className="label text-paper/70">Invoices</h2>
      {!paymentConfigured && (
        <p className="label text-accent border border-accent/40 px-4 py-3">
          {NOT_CONFIGURED}: invoices cannot be sent until our bank details are set.{" "}
          <Link href="/admin/settings/payment" className="underline">
            Open payment settings
          </Link>
        </p>
      )}
      {invoices.length === 0 ? (
        <p className="label text-paper/35 border border-paper/10 px-4 py-3">No invoices yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className={th}>Number</th>
                <th className={th}>Issued</th>
                <th className={th}>Due</th>
                <th className={th}>Net total</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-paper/10 last:border-b-0">
                  <td className={td}>
                    {inv.number}
                    <span className="label text-paper/35 block mt-1">
                      {inv.lines.length} line{inv.lines.length === 1 ? "" : "s"}
                      {inv.tax_rate_bp > 0 ? ` · tax ${percent(inv.tax_rate_bp)}` : ""}
                    </span>
                    {inv.lines
                      .filter((l) => (l.discount ?? 0) > 0)
                      .map((l) => (
                        <span key={invoiceLineKey(l) + l.period} className="label text-paper/55 block mt-1">
                          {l.label}: {mnt(l.amount)} − {mnt(l.discount ?? 0)}
                          {l.discount_bp ? ` (${percent(l.discount_bp)})` : ""} = {mnt(l.amount - (l.discount ?? 0))}
                          {l.discount_reason ? ` · ${l.discount_reason}` : ""}
                        </span>
                      ))}
                  </td>
                  <td className={`${td} text-paper/70`}>{day(inv.issued_at)}</td>
                  <td className={`${td} text-paper/70`}>{day(inv.due_at) || "—"}</td>
                  <td className={td}>
                    {mnt(inv.total)}
                    {(inv.discount_total ?? 0) > 0 && (
                      <span className="label text-paper/35 block mt-1">
                        gross {mnt(inv.subtotal)} − discount {mnt(inv.discount_total ?? 0)}
                        {inv.tax_amount > 0 ? ` + tax ${mnt(inv.tax_amount)}` : ""}
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <span className={`label ${inv.status === "void" ? "text-paper/35" : inv.status === "paid" ? "text-paper" : "text-paper/70"}`}>
                      {inv.status}
                    </span>
                    {inv.sent_at && (
                      <span className="label text-paper/35 block mt-1">
                        sent {day(inv.sent_at)} to {inv.sent_to}
                      </span>
                    )}
                    {inv.paid_at && <span className="label text-paper/35 block mt-1">paid {day(inv.paid_at)}</span>}
                    {inv.payment && <PaymentRecord payment={inv.payment} />}
                    {inv.payment_instructions && <SentInstructions pay={inv.payment_instructions} />}
                  </td>
                  <td className={td}>
                    <InvoiceButtons
                      invoice={inv}
                      invoiceStep={invoiceStep}
                      editInvoice={editInvoice}
                      deleteInvoice={deleteInvoice}
                      markPaid={markPaid}
                      onPreview={() => openPreview(inv)}
                      paymentConfigured={paymentConfigured}
                      nowIso={nowIso}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {preview && <InvoicePreviewPanel preview={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}

// The invoice mail as rendered by the server, in an iframe with an empty
// sandbox (no scripts, no forms, no navigation, unique origin), so nothing in
// the HTML can run or reach the console.
function InvoicePreviewPanel({
  preview,
  onClose,
}: {
  preview: { number: string; loading: boolean; error?: string; subject?: string; html?: string };
  onClose: () => void;
}) {
  return (
    <div className="border border-paper/10 p-4 flex flex-col gap-3" role="region" aria-label={`Preview of ${preview.number}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="label text-paper/70">
          Preview · {preview.number}
          {preview.subject ? ` · subject: ${preview.subject}` : ""}
        </p>
        <button type="button" onClick={onClose} className={linkBtn}>
          Close
        </button>
      </div>
      {preview.loading && <p className="label text-paper/35">Rendering…</p>}
      {preview.error && <p className="label text-accent">{preview.error}</p>}
      {preview.html && (
        <iframe title={`Invoice ${preview.number} preview`} srcDoc={preview.html} sandbox="" className="w-full h-[760px] bg-white border border-paper/10" />
      )}
    </div>
  );
}

function PaymentRecord({ payment: p }: { payment: NonNullable<Invoice["payment"]> }) {
  const rows: [string, string][] = [
    ["Method", methodLabel(p.method)],
    ["Amount received", mnt(p.amount_received)],
  ];
  if (p.reference) rows.push(["Reference", p.reference]);
  if (p.payer_name) rows.push(["Payer", p.payer_name]);
  if (p.payer_account_last4) rows.push(["Payer account", `•••• ${p.payer_account_last4}`]);
  if (p.note) rows.push(["Note", p.note]);
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-paper/70 max-w-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="label text-paper/35">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// The bank details the tenant received, as they were at the first send.
function SentInstructions({ pay }: { pay: NonNullable<Invoice["payment_instructions"]> }) {
  return (
    <details className="mt-2 max-w-xs">
      <summary className="label text-paper/55 cursor-pointer">Payment instructions sent</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-paper/70">
        {pay.company_name && (
          <>
            <dt className="label text-paper/35">Issuer</dt>
            <dd className="break-words">{pay.company_name}</dd>
          </>
        )}
        {pay.contact_person && (
          <>
            <dt className="label text-paper/35">Contact</dt>
            <dd className="break-words">{pay.contact_person}</dd>
          </>
        )}
        <dt className="label text-paper/35">Bank</dt>
        <dd className="break-words">{pay.bank_name}</dd>
        <dt className="label text-paper/35">Account name</dt>
        <dd className="break-words">{pay.account_name}</dd>
        <dt className="label text-paper/35">Account no.</dt>
        <dd className="break-words">{pay.account_number}</dd>
        {pay.swift && (
          <>
            <dt className="label text-paper/35">SWIFT</dt>
            <dd className="break-words">{pay.swift}</dd>
          </>
        )}
        {pay.instructions && (
          <>
            <dt className="label text-paper/35">Note</dt>
            <dd className="break-words">{pay.instructions}</dd>
          </>
        )}
      </dl>
    </details>
  );
}

function InvoiceButtons({
  invoice,
  invoiceStep,
  editInvoice,
  deleteInvoice,
  markPaid,
  onPreview,
  paymentConfigured,
  nowIso,
}: {
  invoice: Invoice;
  invoiceStep: InvoiceStepAction;
  editInvoice: EditInvoice;
  deleteInvoice: DeleteInvoice;
  markPaid: MarkPaid;
  onPreview: () => void;
  paymentConfigured: boolean;
  nowIso: string;
}) {
  const step = (s: InvoiceStep) => invoiceStep.bind(null, invoice.id, s);
  return (
    <div className="flex flex-col gap-2 items-start">
      <button type="button" onClick={onPreview} className={linkBtn}>
        Preview
      </button>
      {invoice.status === "draft" && <EditInvoiceForm invoice={invoice} editInvoice={editInvoice} />}
      {invoice.status === "draft" && (
        <StepButton
          label="Delete"
          confirmText={`Delete draft ${invoice.number}? Its lines can then be invoiced again. This cannot be undone.`}
          action={deleteInvoice.bind(null, invoice.id)}
        />
      )}
      {invoice.status === "draft" &&
        (paymentConfigured ? (
          <StepButton
            label="Send"
            confirmText={`Email ${invoice.number} (${mnt(invoice.total)}) to the tenant's contact address?`}
            action={step("send")}
          />
        ) : (
          <DisabledAction label="Send" reason={NOT_CONFIGURED} />
        ))}
      {invoice.status === "sent" &&
        (paymentConfigured ? (
          <StepButton
            label="Resend"
            confirmText={`${invoice.number} was already sent to ${invoice.sent_to}. Send it again to the tenant's contact address?`}
            action={step("resend")}
          />
        ) : (
          <DisabledAction label="Resend" reason={NOT_CONFIGURED} />
        ))}
      {invoice.status === "sent" && <MarkPaidForm invoice={invoice} markPaid={markPaid} nowIso={nowIso} />}
      {(invoice.status === "draft" || invoice.status === "sent") && (
        <StepButton
          label="Void"
          confirmText={`Void ${invoice.number}? Its lines can then be invoiced again. This cannot be undone.`}
          action={step("void")}
        />
      )}
    </div>
  );
}

// Edits the due date and tax rate of a draft. Totals are recomputed by the
// server; the form only sends the two choices.
function EditInvoiceForm({ invoice, editInvoice }: { invoice: Invoice; editInvoice: EditInvoice }) {
  const [open, setOpen] = useState(false);
  // Per-line discount controls, prefilled from the invoice: a percent the
  // operator entered comes back as a percent, any other discount as an amount.
  const keyed = invoice.lines.map((l) => ({ key: invoiceLineKey(l), line: l })).filter((r) => r.key !== "");
  const [drafts, setDrafts] = useState<Record<string, DiscountDraft>>(() =>
    Object.fromEntries(
      keyed.map(({ key, line }): [string, DiscountDraft] => {
        const off = line.discount ?? 0;
        if (off <= 0) return [key, NO_DISCOUNT];
        const reason = line.discount_reason ?? "";
        return line.discount_bp
          ? [key, { type: "percent", value: String(line.discount_bp / 100), reason }]
          : [key, { type: "amount", value: String(off), reason }];
      }),
    ),
  );
  const [taxRaw, setTaxRaw] = useState(invoice.tax_rate_bp > 0 ? String(invoice.tax_rate_bp / 100) : "");
  // Closes the form once the server accepted the edit; the refreshed list
  // then shows the new values.
  const [state, formAction, pending] = useActionState(async (prev: CostingFormState, formData: FormData) => {
    const res = await editInvoice(invoice.id, prev, formData);
    if (res.saved) setOpen(false);
    return res;
  }, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={linkBtn}>
        Edit
      </button>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-3 w-[28rem] max-w-full border border-paper/10 p-3">
      <p className="text-sm text-paper/70">Edit {invoice.number}. Lines cannot be changed; each can be discounted.</p>
      <AdminField label="Due date" htmlFor={`edit_due_at-${invoice.id}`} hint="Not before the issue date">
        <input
          id={`edit_due_at-${invoice.id}`}
          name="due_at"
          type="date"
          defaultValue={day(invoice.due_at)}
          min={day(invoice.issued_at)}
          className={fieldInputClass}
        />
      </AdminField>
      <AdminField label="Tax rate (%)" htmlFor={`edit_tax_rate-${invoice.id}`} hint="e.g. 10 or 8.25. Totals are calculated by the server.">
        <input
          id={`edit_tax_rate-${invoice.id}`}
          name="tax_rate"
          inputMode="decimal"
          placeholder="No tax"
          maxLength={6}
          value={taxRaw}
          onChange={(e) => setTaxRaw(e.target.value)}
          className={fieldInputClass}
        />
      </AdminField>
      <fieldset className="flex flex-col gap-3">
        <legend className="label text-paper/70 mb-1">Line discounts</legend>
        {keyed.map(({ key, line }) => (
          <div key={key} className="flex flex-col gap-2">
            <input type="hidden" name="line_keys" value={key} />
            <p className="text-sm flex justify-between gap-3">
              <span>{line.label}</span>
              <span>{mnt(line.amount)}</span>
            </p>
            <DiscountControl
              id={key}
              gross={line.amount}
              draft={drafts[key] ?? NO_DISCOUNT}
              onChange={(next) => setDrafts((all) => ({ ...all, [key]: next }))}
            />
          </div>
        ))}
      </fieldset>
      <TotalsPreview rows={keyed.map(({ key, line }) => ({ gross: line.amount, draft: drafts[key] ?? NO_DISCOUNT }))} taxRaw={taxRaw} />
      {state.error && <p className="label text-accent">{state.error}</p>}
      <div className="flex items-center gap-3">
        <ActionButton type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </ActionButton>
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="label text-paper/55 hover:text-paper transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function DisabledAction({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex flex-col gap-1">
      <button type="button" disabled title={reason} aria-disabled="true" className="label text-paper/25 cursor-not-allowed text-left">
        {label}
      </button>
      <span className="label text-paper/35 max-w-xs">{reason}</span>
    </div>
  );
}

// Records the transaction while marking the invoice paid. The amount is
// shown read-only: it must equal the invoice total, which the server checks.
function MarkPaidForm({ invoice, markPaid, nowIso }: { invoice: Invoice; markPaid: MarkPaid; nowIso: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markPaid.bind(null, invoice.id, invoice.total), {});
  const today = day(nowIso);
  const maxDate = day(new Date(new Date(nowIso).getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={linkBtn}>
        Mark paid
      </button>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-3 w-72 border border-paper/10 p-3">
      <p className="text-sm text-paper/70">Record the payment of {invoice.number}. This cannot be undone.</p>
      <AdminField label="Method" htmlFor={`method-${invoice.id}`}>
        <select id={`method-${invoice.id}`} name="method" defaultValue="bank_transfer" className={fieldInputClass}>
          {PAY_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </AdminField>
      <AdminField label="Paid on" htmlFor={`paid_at-${invoice.id}`}>
        <input
          id={`paid_at-${invoice.id}`}
          name="paid_at"
          type="date"
          defaultValue={today}
          min={day(invoice.issued_at)}
          max={maxDate}
          className={fieldInputClass}
        />
      </AdminField>
      <AdminField label="Reference" htmlFor={`reference-${invoice.id}`} hint="Bank transaction reference">
        <input id={`reference-${invoice.id}`} name="reference" maxLength={100} className={fieldInputClass} />
      </AdminField>
      <AdminField label="Payer name" htmlFor={`payer_name-${invoice.id}`}>
        <input id={`payer_name-${invoice.id}`} name="payer_name" maxLength={100} className={fieldInputClass} />
      </AdminField>
      <AdminField label="Payer account, last 4 digits" htmlFor={`last4-${invoice.id}`} hint="Never enter the full account number">
        <input
          id={`last4-${invoice.id}`}
          name="payer_account_last4"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          className={fieldInputClass}
        />
      </AdminField>
      <AdminField label="Amount received (MNT)" htmlFor={`amount-${invoice.id}`} hint="Must equal the invoice total">
        <input id={`amount-${invoice.id}`} value={invoice.total.toLocaleString("en-US")} readOnly className={`${fieldInputClass} text-paper/70`} />
      </AdminField>
      <AdminField label="Note" htmlFor={`note-${invoice.id}`}>
        <textarea id={`note-${invoice.id}`} name="note" maxLength={500} rows={2} className={fieldTextareaClass} />
      </AdminField>
      {state.error && <p className="label text-accent">{state.error}</p>}
      <div className="flex items-center gap-3">
        <ActionButton type="submit" variant="outline" disabled={pending}>
          {pending ? "Working…" : "Mark paid"}
        </ActionButton>
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="label text-paper/55 hover:text-paper transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// A button that asks before it acts and shows the server's message on failure.
function StepButton({
  label,
  confirmText,
  action,
}: {
  label: string;
  confirmText: string;
  action: (prev: CostingFormState) => Promise<CostingFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className={linkBtn}>
          {label}
        </button>
      ) : (
        <>
          <p className="text-sm text-paper/70 max-w-xs">{confirmText}</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Working…" : `Yes, ${label.toLowerCase()}`}
            </ActionButton>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="label text-paper/55 hover:text-paper transition-colors">
              Cancel
            </button>
          </div>
        </>
      )}
      {state.error && <p className="label text-accent max-w-xs">{state.error}</p>}
    </form>
  );
}
