"use client";

import Link from "next/link";
import { useActionState } from "react";
import Mark from "@/components/Mark";
import { ActionButton } from "@/components/Button";
import AdminField, { fieldInputClass } from "@/components/AdminField";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink text-paper px-6">
      <form action={formAction} className="w-full max-w-sm flex flex-col gap-6 border border-paper/15 p-8">
        <div className="flex flex-col gap-3">
          <Mark size={18} className="text-paper" />
          <div>
            <span className="label text-paper/55 block mb-1">Digitalservice</span>
            <h1 className="font-heading text-2xl">Superadmin sign in</h1>
          </div>
        </div>

        {notice && <p className="label text-paper border border-paper/20 px-3 py-2">{notice}</p>}

        <AdminField label="Email" htmlFor="email">
          <input id="email" name="email" type="email" required autoFocus className={fieldInputClass} />
        </AdminField>

        <AdminField label="Password" htmlFor="password">
          <input id="password" name="password" type="password" required className={fieldInputClass} />
        </AdminField>

        {state.error && <p className="label text-accent">{state.error}</p>}

        <ActionButton type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </ActionButton>

        <Link href="/admin/forgot-password" className="label text-paper/55 hover:text-accent transition-colors">
          Forgot password?
        </Link>
      </form>
    </main>
  );
}
