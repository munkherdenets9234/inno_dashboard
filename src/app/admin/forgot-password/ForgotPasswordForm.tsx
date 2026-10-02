"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Mark from "@/components/Mark";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import {
  confirmResetAction,
  requestResetAction,
  type ConfirmResetState,
  type RequestResetState,
} from "./actions";

const requestInitial: RequestResetState = {};
const confirmInitial: ConfirmResetState = {};

export default function ForgotPasswordForm() {
  const [requestState, requestAction, requesting] = useActionState(requestResetAction, requestInitial);

  // "Start over" returns to step one without losing what was typed.
  const [startedOver, setStartedOver] = useState(false);
  const email = requestState.sentTo;
  const onCodeStep = Boolean(email) && !startedOver;

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink text-paper px-6">
      <div className="w-full max-w-sm flex flex-col gap-6 border border-paper/15 p-8">
        <div className="flex flex-col gap-3">
          <Mark size={18} className="text-paper" />
          <div>
            <span className="label text-paper/55 block mb-1">Digitalservice</span>
            <h1 className="font-heading text-2xl">Reset your password</h1>
          </div>
        </div>

        {!onCodeStep ? (
          <form
            action={(fd) => {
              setStartedOver(false);
              requestAction(fd);
            }}
            className="flex flex-col gap-6"
          >
            <p className="text-sm text-paper/70">
              Enter the email address of your account and we will send a 6-digit code to it.
            </p>

            <AdminField label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                defaultValue={email ?? ""}
                className={fieldInputClass}
              />
            </AdminField>

            {requestState.error && <p className="label text-accent">{requestState.error}</p>}

            <ActionButton type="submit" disabled={requesting} className="w-full">
              {requesting ? "Sending…" : "Send code"}
            </ActionButton>
          </form>
        ) : (
          <CodeStep email={email!} onStartOver={() => setStartedOver(true)} />
        )}

        <Link href="/admin/login" className="label text-paper/55 hover:text-accent transition-colors">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

// The code step is its own component so that its form state belongs to ONE
// request for a code. Left in the parent, the error from a previous attempt
// (for a different address, or an old code) survived "start over" and showed up
// on the fresh step as if it were about the new code.
function CodeStep({ email, onStartOver }: { email: string; onStartOver: () => void }) {
  const [state, action, pending] = useActionState(confirmResetAction, confirmInitial);

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Worded to be true whether or not the address has an account: the
          server answers the same either way, and this must not hint. */}
      <p className="text-sm text-paper/70">
        If <strong>{email}</strong> belongs to an account, a code is on its way. It expires in 10 minutes and works once.
      </p>

      <input type="hidden" name="email" value={email} />

      <AdminField label="Code" htmlFor="code">
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className={`${fieldInputClass} tracking-[0.4em]`}
        />
      </AdminField>

      <AdminField label="New password" htmlFor="new_password" hint="At least 8 characters.">
        <input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={fieldInputClass}
        />
      </AdminField>

      <AdminField label="Confirm new password" htmlFor="confirm_password">
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={fieldInputClass}
        />
      </AdminField>

      {state.error && <p className="label text-accent">{state.error}</p>}

      <ActionButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Set new password"}
      </ActionButton>

      <button
        type="button"
        onClick={onStartOver}
        className="label text-paper/55 hover:text-paper transition-colors self-start"
      >
        Use a different email or send a new code
      </button>
    </form>
  );
}
