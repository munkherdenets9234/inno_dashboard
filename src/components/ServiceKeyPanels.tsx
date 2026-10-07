"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import { NewKey } from "@/components/TenantDetailPanels";
import type {
  CreateServiceKeyState,
  ServiceKeyActionState,
} from "@/app/admin/(console)/service-keys/actions";

type CreateAction = (prev: CreateServiceKeyState, formData: FormData) => Promise<CreateServiceKeyState>;
type RowAction = (prev: ServiceKeyActionState) => Promise<ServiceKeyActionState>;

export function CreateServiceKeyForm({ action }: { action: CreateAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="border border-paper/10 p-5 flex flex-col gap-3">
      <span className="label text-paper/70">New service key</span>
      {state.newKey ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-paper/70">
            Key for {state.name}. Put it in that service&apos;s <code>TENANTCORE_SERVICE_KEY</code> and restart it.
          </p>
          <NewKey value={state.newKey} />
        </div>
      ) : (
        <form action={formAction} className="flex items-center gap-3 flex-wrap">
          <input
            name="name"
            required
            maxLength={64}
            placeholder="Product service name, e.g. digitalservice"
            className="bg-transparent border border-paper/10 px-3 py-2 text-sm min-w-72 focus:outline-none focus:border-accent"
          />
          <ActionButton type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create key"}
          </ActionButton>
        </form>
      )}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </div>
  );
}

function ConfirmAction({
  action,
  triggerLabel,
  confirmLabel,
  pendingLabel,
  warning,
}: {
  action: RowAction;
  triggerLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  warning: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  if (state.newKey) return <NewKey value={state.newKey} />;
  if (state.done) return <span className="label text-paper/35">Done</span>;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="label text-paper/55 hover:text-accent transition-colors text-left"
        >
          {triggerLabel}
        </button>
      ) : (
        <>
          <p className="text-sm text-paper/70 max-w-md">{warning}</p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? pendingLabel : confirmLabel}
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

export function ServiceKeyRowActions({
  name,
  rotate,
  revoke,
}: {
  name: string;
  rotate: RowAction;
  revoke: RowAction;
}) {
  return (
    <div className="flex items-start gap-6 flex-wrap">
      <ConfirmAction
        action={rotate}
        triggerLabel="Rotate"
        confirmLabel="Yes, rotate"
        pendingLabel="Rotating…"
        warning={`Rotate the key for ${name}? ${name} stops working until its TENANTCORE_SERVICE_KEY is replaced with the new key.`}
      />
      <ConfirmAction
        action={revoke}
        triggerLabel="Revoke"
        confirmLabel="Yes, revoke"
        pendingLabel="Revoking…"
        warning={`Revoke the key for ${name}? It stops working at once and cannot be re-enabled. Rotate instead to keep the service running with a new key.`}
      />
    </div>
  );
}
