"use client";

import { useState } from "react";
import { fieldTextareaClass } from "@/components/AdminField";
import type { LocaleList } from "@/lib/types";

const LOCALES: (keyof LocaleList)[] = ["en", "mn"];

function toLines(items: string[]): string {
  return items.join("\n");
}

function fromLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function MultiLangListField({
  name,
  label,
  defaultValue,
  rows = 5,
}: {
  name: string;
  label: string;
  defaultValue?: LocaleList;
  rows?: number;
}) {
  const [text, setText] = useState<Record<string, string>>({
    en: toLines(defaultValue?.en ?? []),
    mn: toLines(defaultValue?.mn ?? []),
  });
  const [active, setActive] = useState<(typeof LOCALES)[number]>("en");

  function update(locale: (typeof LOCALES)[number], value: string) {
    setText((t) => ({ ...t, [locale]: value }));
  }

  const serialized: LocaleList = {
    en: fromLines(text.en ?? ""),
    mn: fromLines(text.mn ?? ""),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="label text-paper/70">{label}</span>
        <div className="flex gap-1">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActive(locale)}
              className={`label px-2 py-1 transition-colors ${
                active === locale ? "text-accent" : "text-paper/35 hover:text-paper/55"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <textarea
        rows={rows}
        value={text[active] ?? ""}
        onChange={(e) => update(active, e.target.value)}
        className={fieldTextareaClass}
      />
      <span className="label text-paper/35">One item per line.</span>
      <input type="hidden" name={name} value={JSON.stringify(serialized)} readOnly />
    </div>
  );
}
