"use client";

import { useActionState, useMemo, useState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { ContentFormState } from "@/app/admin/(console)/content/actions";
import type { ContentEntry } from "@/lib/data/content";

const LOCALES = ["en", "mn"] as const;

// A leaf is one of three shapes, and the editor has to render each
// differently. Kind is derived from the value rather than declared, because
// the shape is whatever the site's dictionary has at that path — there is no
// schema to consult, and inventing one here would go stale the first time a
// developer changes a string into a list.
type Kind = "text" | "list" | "json";

function kindOf(entry: ContentEntry): Kind {
  for (const locale of LOCALES) {
    const v = entry.values[locale];
    if (Array.isArray(v)) {
      return v.some((item) => item !== null && typeof item === "object") ? "json" : "list";
    }
    if (typeof v === "string") return "text";
  }
  return "text";
}

// Long prose gets a textarea, labels get an input. Purely about comfort —
// both produce a string.
function isLong(entry: ContentEntry) {
  return LOCALES.some((l) => typeof entry.values[l] === "string" && (entry.values[l] as string).length > 90);
}

function toEditable(value: unknown, kind: Kind): string {
  if (value === undefined || value === null) return "";
  if (kind === "list") return (value as string[]).join("\n");
  if (kind === "json") return JSON.stringify(value, null, 2);
  return String(value);
}

function fromEditable(text: string, kind: Kind): { value: unknown } | { error: string } {
  if (kind === "list") {
    return { value: text.split("\n").map((s) => s.trim()).filter(Boolean) };
  }
  if (kind === "json") {
    const trimmed = text.trim();
    if (!trimmed) return { value: [] };
    try {
      return { value: JSON.parse(trimmed) };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }
  return { value: text };
}

export default function ContentEditor({
  entries,
  action,
}: {
  entries: ContentEntry[];
  action: (prevState: ContentFormState, formData: FormData) => Promise<ContentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [filter, setFilter] = useState("");

  const kinds = useMemo(() => new Map(entries.map((e) => [e.path, kindOf(e)])), [entries]);

  // Draft holds the raw text of every field, keyed "path|locale". Kept as
  // text rather than parsed values so a half-typed JSON array does not throw
  // away what was typed before it became valid again.
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const e of entries) {
      for (const locale of LOCALES) {
        out[`${e.path}|${locale}`] = toEditable(e.values[locale], kinds.get(e.path) ?? "text");
      }
    }
    return out;
  });

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        LOCALES.some((l) => (draft[`${e.path}|${l}`] ?? "").toLowerCase().includes(q)),
    );
  }, [entries, filter, draft]);

  // Serialise on every keystroke rather than on submit, so the hidden field
  // is always current — a form posted by Enter in a text input never sees a
  // stale payload. Parse errors surface here too, before the save.
  const { payload, errors } = useMemo(() => {
    const out: ContentEntry[] = [];
    const errs: Record<string, string> = {};
    for (const e of entries) {
      const kind = kinds.get(e.path) ?? "text";
      const values: Record<string, unknown> = {};
      for (const locale of LOCALES) {
        const parsed = fromEditable(draft[`${e.path}|${locale}`] ?? "", kind);
        if ("error" in parsed) {
          errs[`${e.path}|${locale}`] = parsed.error;
          continue;
        }
        values[locale] = parsed.value;
      }
      out.push({ path: e.path, values });
    }
    return { payload: JSON.stringify(out), errors: errs };
  }, [entries, draft, kinds]);

  const errorCount = Object.keys(errors).length;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="entries" value={payload} />

      <div className="flex items-center gap-4 flex-wrap sticky top-0 bg-ink py-3 z-10 border-b border-paper/10">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Filter ${entries.length} entries…`}
          className={`${fieldInputClass} max-w-xs`}
        />
        <ActionButton type="submit" disabled={pending || errorCount > 0}>
          {pending ? "Saving…" : "Save page"}
        </ActionButton>
        {errorCount > 0 && (
          <span className="label text-accent">
            {errorCount} field{errorCount > 1 ? "s" : ""} not valid JSON
          </span>
        )}
        {state.error && <span className="label text-accent">{state.error}</span>}
        {state.saved && !pending && <span className="label text-paper/55">Saved.</span>}
      </div>

      <p className="label text-paper/35">
        Clearing a field restores what the site ships with — it does not blank the section.
      </p>

      {visible.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">
          Nothing matches “{filter}”.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {visible.map((entry) => {
            const kind = kinds.get(entry.path) ?? "text";
            return (
              <div key={entry.path} className="border border-paper/10 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <code className="text-sm text-paper/70">{entry.path}</code>
                  <span className="label text-paper/25">
                    {kind === "list" ? "one per line" : kind === "json" ? "JSON" : "text"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LOCALES.map((locale) => {
                    const key = `${entry.path}|${locale}`;
                    const err = errors[key];
                    const long = kind !== "text" || isLong(entry);
                    return (
                      <label key={locale} className="flex flex-col gap-1">
                        <span className="label text-paper/35">{locale.toUpperCase()}</span>
                        {long ? (
                          <textarea
                            value={draft[key] ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                            rows={kind === "json" ? 8 : kind === "list" ? 4 : 3}
                            className={`${fieldTextareaClass} ${err ? "border-accent" : ""} ${
                              kind === "json" ? "font-mono text-xs" : ""
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={draft[key] ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                            className={fieldInputClass}
                          />
                        )}
                        {err && <span className="label text-accent">{err}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </form>
  );
}
