"use client";

import { useState } from "react";

// A secret the backend showed us exactly once — a tenant's API key, a service
// client's key, a generated password. tenantcore stores only a hash; there is
// no endpoint that returns any of these again, so if this panel is dismissed
// without copying, the only remedy is issuing a new one.
//
// Which is why it is loud, why it does not auto-dismiss, and why the copy
// button is the primary action rather than a convenience.
export default function SecretOnce({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // value is on screen and selectable, so this is not worth an error
      // dialog — the operator can select it by hand.
      setCopied(false);
    }
  }

  return (
    <div className="border border-accent px-4 py-3 flex flex-col gap-2">
      <span className="label text-accent">{label}</span>
      <code className="text-sm break-all select-all bg-paper/5 px-3 py-2">{value}</code>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={copy}
          className="label px-3 py-1.5 border border-paper/30 text-paper hover:border-paper transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <span className="label text-paper/35">
          {hint ?? "Shown once. It is stored only as a hash and cannot be retrieved again."}
        </span>
      </div>
    </div>
  );
}
