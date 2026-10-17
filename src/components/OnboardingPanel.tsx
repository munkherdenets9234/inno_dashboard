"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldTextareaClass } from "@/components/AdminField";
import type { CostingFormState, InvoicePreviewState } from "@/app/admin/(console)/tenants/actions";
import type { OnboardingStatus } from "@/lib/types";

type Preview = (note: string) => Promise<InvoicePreviewState>;
type Send = (resend: boolean, prev: CostingFormState, formData: FormData) => Promise<CostingFormState>;

const NOTE_MAX = 500;

const BLOCKERS: Record<string, string> = {
  no_contact_email: "Tenant has no contact email",
  no_domains: "Add at least one domain on the Domains tab",
  email_off: "Email is not configured",
};

// Fixed UTC format so the server render and the browser agree.
function sentOn(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export default function OnboardingPanel({ status, preview, send }: { status: OnboardingStatus; preview: Preview; send: Send }) {
  const resend = Boolean(status.sent_at);
  const [note, setNote] = useState("");
  const [view, setView] = useState<{ loading: boolean; error?: string; subject?: string; html?: string } | null>(null);
  const [state, formAction, pending] = useActionState((prev: CostingFormState, fd: FormData) => send(resend, prev, fd), {});

  const openPreview = async () => {
    setView({ loading: true });
    const res = await preview(note);
    setView({ loading: false, ...res });
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="label text-paper/70">Onboarding email</h2>
      {status.sent_at && (
        <p className="label text-paper/70">
          Sent to {status.sent_to} on {sentOn(status.sent_at)}
        </p>
      )}
      {!status.can_send && status.blockers.length > 0 && (
        <ul className="label text-accent border border-accent/40 px-4 py-3 flex flex-col gap-1">
          {status.blockers.map((b) => (
            <li key={b}>{BLOCKERS[b] ?? b}</li>
          ))}
        </ul>
      )}
      <form
        action={formAction}
        onSubmit={(e) => {
          if (resend && !window.confirm(`Send the onboarding email again to ${status.sent_to}?`)) e.preventDefault();
        }}
        className="flex flex-col gap-3 max-w-2xl"
      >
        <AdminField label="Note (optional)" htmlFor="onboarding-note" hint={`${note.length}/${NOTE_MAX}`}>
          <textarea
            id="onboarding-note"
            name="note"
            maxLength={NOTE_MAX}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldTextareaClass}
          />
        </AdminField>
        {state.error && <p className="label text-accent">{state.error}</p>}
        {state.saved && !state.error && <p className="label text-paper/70">Sent.</p>}
        <div className="flex items-center gap-3">
          <ActionButton type="button" variant="outline" onClick={openPreview} disabled={view?.loading}>
            {view?.loading ? "Rendering…" : "Preview"}
          </ActionButton>
          <ActionButton type="submit" disabled={pending || !status.can_send}>
            {pending ? "Sending…" : resend ? "Resend" : "Send"}
          </ActionButton>
        </div>
      </form>
      {view && (
        <div className="border border-paper/10 p-4 flex flex-col gap-3" role="region" aria-label="Onboarding email preview">
          {view.subject && <p className="label text-paper/70">Preview · subject: {view.subject}</p>}
          {view.loading && <p className="label text-paper/35">Rendering…</p>}
          {view.error && <p className="label text-accent">{view.error}</p>}
          {view.html && (
            <iframe title="Onboarding email preview" srcDoc={view.html} sandbox="" className="w-full h-[760px] bg-white border border-paper/10" />
          )}
        </div>
      )}
    </section>
  );
}
