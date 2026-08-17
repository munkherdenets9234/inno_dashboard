"use client";

import { useState } from "react";
import { fieldInputClass, fieldTextareaClass } from "@/components/AdminField";
import type { LocaleText } from "@/lib/types";

const LOCALES: (keyof LocaleText)[] = ["en", "mn"];

export default function MultiLangField({
  name,
  label,
  defaultValue,
  multiline,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: LocaleText;
  multiline?: boolean;
  rows?: number;
}) {
  const [values, setValues] = useState<LocaleText>(defaultValue ?? {});
  const [active, setActive] = useState<(typeof LOCALES)[number]>("en");

  function update(locale: (typeof LOCALES)[number], value: string) {
    setValues((v) => ({ ...v, [locale]: value }));
  }

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
              {!values[locale] && <span className="ml-1">·</span>}
            </button>
          ))}
        </div>
      </div>
      {multiline ? (
        <textarea
          rows={rows}
          value={values[active] ?? ""}
          onChange={(e) => update(active, e.target.value)}
          className={fieldTextareaClass}
        />
      ) : (
        <input
          type="text"
          value={values[active] ?? ""}
          onChange={(e) => update(active, e.target.value)}
          className={fieldInputClass}
        />
      )}
      <input type="hidden" name={name} value={JSON.stringify(values)} readOnly />
    </div>
  );
}
