"use client";

import { useState, useTransition } from "react";
import StatusBadge from "@/components/StatusBadge";
import { ActionButton } from "@/components/Button";
import { updateQuoteStatusAction } from "@/app/(dashboard)/quotes/actions";
import type { Quote, QuoteStatus } from "@/lib/types";

const TRANSITIONS: { to: QuoteStatus; label: string }[] = [
  { to: "contacted", label: "Mark contacted" },
  { to: "quoted", label: "Mark quoted" },
  { to: "closed", label: "Close" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function QuoteRow({ quote, tenantName }: { quote: Quote; tenantName?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pendingTo, setPendingTo] = useState<QuoteStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  function transition(to: QuoteStatus) {
    setPendingTo(to);
    setError(null);
    startTransition(async () => {
      try {
        await updateQuoteStatusAction(quote.id, to);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update status.");
      } finally {
        setPendingTo(null);
      }
    });
  }

  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className={`border-b border-paper/10 cursor-pointer hover:bg-paper/5 transition-colors ${
          open ? "border-b-0" : ""
        } ${quote.status === "new" ? "border-l-2 border-l-accent" : ""}`}
      >
        <td className="px-4 py-3 align-top text-paper/55 text-xs whitespace-nowrap">
          {formatDate(quote.created_at)}
        </td>
        <td className={`px-4 py-3 align-top ${quote.status === "new" ? "font-semibold" : ""}`}>{quote.name}</td>
        <td className="px-4 py-3 align-top text-paper/70">{tenantName ?? "— (prospect)"}</td>
        <td className="px-4 py-3 align-top text-paper/70">{quote.company_name || "—"}</td>
        <td className="px-4 py-3 align-top">
          <StatusBadge status={quote.status} />
        </td>
      </tr>
      {open && (
        <tr className="border-b border-paper/10">
          <td colSpan={5} className="px-4 py-4 bg-paper/[0.03]">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="label text-paper/35 block">Email</span>
                  {quote.email}
                </div>
                <div>
                  <span className="label text-paper/35 block">Phone</span>
                  {quote.phone || "—"}
                </div>
                <div>
                  <span className="label text-paper/35 block">Budget</span>
                  {quote.budget || "—"}
                </div>
                <div>
                  <span className="label text-paper/35 block">Timeline</span>
                  {quote.timeline || "—"}
                </div>
                {quote.package_slug && (
                  <div>
                    <span className="label text-paper/35 block">Package</span>
                    {quote.package_slug}
                  </div>
                )}
                {quote.lastEditedBy && (
                  <div>
                    <span className="label text-paper/35 block">Last edited by</span>
                    {quote.lastEditedBy}
                  </div>
                )}
              </div>
              <div>
                <span className="label text-paper/35 block mb-1">Message</span>
                <p className="text-sm text-paper/85 whitespace-pre-wrap">{quote.message || "—"}</p>
              </div>
              {error && <p className="label text-accent">{error}</p>}
              <div className="flex gap-2.5 flex-wrap">
                {TRANSITIONS.map((t) => (
                  <ActionButton
                    key={t.to}
                    variant="outline"
                    disabled={quote.status === t.to || pending}
                    onClick={() => transition(t.to)}
                  >
                    {pendingTo === t.to ? "…" : t.label}
                  </ActionButton>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
