"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import type { ResetPasswordState, RotateKeyState } from "@/app/admin/(console)/tenants/actions";

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

export function ResetPasswordControl({ email, action }: { email: string; action: ResetAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (state.sent) {
    return <p className="label text-paper">A reset code was emailed to {email}</p>;
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
            Reset password
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-paper/70">Email a password reset code to {email}?</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Sending…" : "Yes, send code"}
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
