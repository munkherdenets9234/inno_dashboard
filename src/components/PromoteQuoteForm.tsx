"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import { promoteQuoteAction } from "@/app/admin/(console)/quotes/actions";
import { suggestSlug } from "@/lib/slug.mjs";
import type { Quote } from "@/lib/types";

type Issued = {
  tenant: { id: string; name: string; slug: string };
  apiKey: string;
  quoteLinked: boolean;
};

// Promotes a prospect quote to a tenant. The API key the backend returns is
// kept in component state ONLY: it is not put in a URL, cookie, storage, log
// or any server-side revalidation, and it is gone on Done, navigation or
// reload. The parent keeps this component mounted while the row is collapsed.
export default function PromoteQuoteForm({
  quote,
  tenantNames,
}: {
  quote: Quote;
  tenantNames: Record<string, string>;
}) {
  const initialName = (quote.company_name || quote.name || "").trim();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(() => suggestSlug(initialName));
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState(quote.email ?? "");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [issued, setIssued] = useState<Issued | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const keyRef = useRef<HTMLInputElement>(null);

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(suggestSlug(value));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    startTransition(async () => {
      let res;
      try {
        res = await promoteQuoteAction(quote.id, {
          name: name.trim(),
          slug: slug.trim(),
          contact_email: email.trim() || undefined,
          domain: domain.trim() || undefined,
        });
      } catch {
        setError("Could not promote this quote. Try again.");
        return;
      }
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setIssued({ tenant: res.tenant, apiKey: res.apiKey, quoteLinked: res.quoteLinked });
      setShowForm(false);
    });
  }

  async function copyKey() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.apiKey);
      setCopyState("copied");
    } catch {
      // Clipboard API unavailable (insecure context, denied): select the
      // field so the key can be copied by hand.
      keyRef.current?.focus();
      keyRef.current?.select();
      setCopyState("manual");
    }
  }

  function done() {
    setIssued(null);
    setCopyState("idle");
  }

  if (issued) {
    return (
      <div className="border border-accent/60 p-4 flex flex-col gap-3" role="status">
        <p className="label text-accent">This key is shown once. Copy it now.</p>
        <p className="text-sm">
          Tenant <strong>{issued.tenant.name}</strong> ({issued.tenant.slug}) was created.
        </p>
        <div className="flex gap-2.5 flex-wrap items-center">
          <input
            ref={keyRef}
            readOnly
            value={issued.apiKey}
            aria-label="Tenant API key"
            autoComplete="off"
            spellCheck={false}
            onFocus={(e) => e.currentTarget.select()}
            className={`${fieldInputClass} font-mono flex-1 min-w-64`}
          />
          <ActionButton type="button" variant="outline" onClick={copyKey}>
            {copyState === "copied" ? "Copied" : "Copy"}
          </ActionButton>
        </div>
        {copyState === "manual" && (
          <p className="label text-paper/70">Copy is unavailable here. The key is selected: press Ctrl+C.</p>
        )}
        {!issued.quoteLinked && (
          <p className="label text-accent">
            The tenant was created but the quote could not be linked to it. Close the quote by hand.
          </p>
        )}
        <div className="flex gap-2.5 flex-wrap items-center">
          <Link href={`/admin/tenants/${issued.tenant.id}`} className="label underline hover:text-accent">
            Open tenant
          </Link>
          <ActionButton type="button" variant="primary" onClick={done}>
            Done
          </ActionButton>
        </div>
      </div>
    );
  }

  if (quote.tenant_id) return null;

  if (quote.promoted_tenant_id) {
    const promotedName = tenantNames[quote.promoted_tenant_id];
    return (
      <p className="text-sm">
        Became tenant{" "}
        <Link href={`/admin/tenants/${quote.promoted_tenant_id}`} className="underline hover:text-accent">
          {promotedName || quote.promoted_tenant_id}
        </Link>
      </p>
    );
  }

  if (!showForm) {
    return (
      <div>
        <ActionButton type="button" variant="outline" onClick={() => setShowForm(true)}>
          Promote to tenant
        </ActionButton>
      </div>
    );
  }

  const id = `promote-${quote.id}`;
  return (
    <form onSubmit={submit} className="border border-paper/15 p-4 flex flex-col gap-3">
      <AdminField label="Tenant name" htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          className={fieldInputClass}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          maxLength={200}
        />
      </AdminField>
      <AdminField label="Slug" htmlFor={`${id}-slug`} hint="Lowercase letters, digits and hyphens.">
        <input
          id={`${id}-slug`}
          className={fieldInputClass}
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          required
          maxLength={60}
          autoComplete="off"
        />
      </AdminField>
      <AdminField label="Contact email" htmlFor={`${id}-email`}>
        <input
          id={`${id}-email`}
          type="email"
          className={fieldInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </AdminField>
      <AdminField label="Domain (optional)" htmlFor={`${id}-domain`}>
        <input
          id={`${id}-domain`}
          className={fieldInputClass}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          autoComplete="off"
        />
      </AdminField>
      {error && <p className="label text-accent">{error}</p>}
      <div className="flex gap-2.5 flex-wrap">
        <ActionButton type="submit" variant="primary" disabled={pending || !name.trim() || !slug.trim()}>
          {pending ? "Promoting…" : "Create tenant"}
        </ActionButton>
        <ActionButton
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setShowForm(false);
            setError(null);
          }}
        >
          Cancel
        </ActionButton>
      </div>
    </form>
  );
}
