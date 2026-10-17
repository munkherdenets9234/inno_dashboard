"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import type { AddAdminState, ResetPasswordState, RotateKeyState } from "@/app/admin/(console)/tenants/actions";
import { validateAdminInvite } from "@/lib/product-service.mjs";

type RotateAction = (prev: RotateKeyState) => Promise<RotateKeyState>;
type ResetAction = (prev: ResetPasswordState) => Promise<ResetPasswordState>;

// The new key lives only in this component's state (the action result). It is
// never written to a URL, storage or the console, and is gone on navigation.
export function NewKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <code className="text-sm break-all border border-paper/10 px-3 py-2 select-all">{value}</code>
        <ActionButton type="button" variant="outline" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </ActionButton>
      </div>
      <p className="label text-accent">
        This key is shown once and cannot be recovered. Copy it now; it disappears when you leave this page.
      </p>
    </div>
  );
}

function RotateControl({
  action,
  warning,
  triggerLabel,
}: {
  action: RotateAction;
  warning: string;
  triggerLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (state.newKey) return <NewKey value={state.newKey} />;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            {triggerLabel}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-paper/70">{warning}</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Rotating…" : "Yes, rotate"}
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

export function TenantKeyPanel({ last4, action }: { last4?: string; action: RotateAction }) {
  return (
    <div className="border border-paper/10 p-5 flex flex-col gap-3">
      <span className="label text-paper/70">Tenant API key</span>
      <p className="text-sm font-mono">•••• {last4 ?? "????"}</p>
      <RotateControl
        action={action}
        triggerLabel="Rotate key"
        warning="Rotate this tenant's API key? The tenant's storefront stops working until its key is replaced with the new one."
      />
    </div>
  );
}

export function ServiceKeyRotate({ productName, action }: { productName: string; action: RotateAction }) {
  return (
    <RotateControl
      action={action}
      triggerLabel="Rotate"
      warning={`Rotate the service key for ${productName}? ${productName} stops working until its TENANTCORE_SERVICE_KEY is replaced with the new key. This affects every tenant of the product.`}
    />
  );
}

export function ResetPasswordControl({
  email,
  action,
  link = false,
}: {
  email: string;
  action: ResetAction;
  link?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (state.sent) {
    return <p className="label text-paper">{link ? "A reset link was emailed." : `A reset code was emailed to ${email}`}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            {link ? "Resend invite / Send reset link" : "Reset password"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-paper/70">{link ? `Email a reset link to ${email}?` : `Email a password reset code to ${email}?`}</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Sending…" : link ? "Yes, send link" : "Yes, send code"}
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

type AddAdminAction = (prev: AddAdminState, formData: FormData) => Promise<AddAdminState>;

export function AddAdminForm({ action }: { action: AddAdminAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [clientError, setClientError] = useState<string | null>(null);

  // Convenience only; the server action validates again.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const v = validateAdminInvite({ name: fd.get("name"), email: fd.get("email") });
    if (v.error !== undefined) {
      e.preventDefault();
      setClientError(v.error);
    } else {
      setClientError(null);
    }
  }

  const error = clientError ?? state.error;

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="border border-paper/10 p-5 flex flex-col gap-3"
    >
      <span className="label text-paper/70">Add tenant admin</span>
      <div className="flex gap-3 flex-wrap items-end">
        <AdminField label="Name" htmlFor="admin-name" className="min-w-56">
          <input id="admin-name" name="name" maxLength={100} autoComplete="off" className={fieldInputClass} />
        </AdminField>
        <AdminField label="Email" htmlFor="admin-email" className="min-w-72">
          <input id="admin-email" name="email" type="email" maxLength={254} autoComplete="off" className={fieldInputClass} />
        </AdminField>
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Sending…" : "Add and send invite"}
        </ActionButton>
      </div>
      {error && <p className="label text-accent">{error}</p>}
      {!error && state.sentTo && <p className="label text-paper">Invite sent to {state.sentTo}.</p>}
    </form>
  );
}
