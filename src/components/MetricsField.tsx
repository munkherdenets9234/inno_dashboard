"use client";

import { useState } from "react";
import { fieldInputClass } from "@/components/AdminField";
import type { LocaleText, ProjectMetric } from "@/lib/types";

export default function MetricsField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: ProjectMetric[];
}) {
  const [metrics, setMetrics] = useState<ProjectMetric[]>(defaultValue ?? []);

  function updateValue(i: number, value: string) {
    setMetrics((rows) => rows.map((r, idx) => (idx === i ? { ...r, value } : r)));
  }

  function updateLabel(i: number, locale: keyof LocaleText, value: string) {
    setMetrics((rows) => rows.map((r, idx) => (idx === i ? { ...r, label: { ...r.label, [locale]: value } } : r)));
  }

  function remove(i: number) {
    setMetrics((rows) => rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label text-paper/70">{label}</span>
        <button
          type="button"
          onClick={() => setMetrics((rows) => [...rows, { label: {}, value: "" }])}
          className="label text-paper/55 hover:text-accent transition-colors"
        >
          + Add metric
        </button>
      </div>
      {metrics.length === 0 ? (
        <p className="label text-paper/35">No metrics yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {metrics.map((m, i) => (
            <div key={i} className="flex gap-3 items-start">
              <input
                placeholder="Value — e.g. 40%"
                value={m.value}
                onChange={(e) => updateValue(i, e.target.value)}
                className={`${fieldInputClass} flex-1`}
              />
              <input
                placeholder="Label (EN)"
                value={m.label.en ?? ""}
                onChange={(e) => updateLabel(i, "en", e.target.value)}
                className={`${fieldInputClass} flex-[2]`}
              />
              <input
                placeholder="Label (MN)"
                value={m.label.mn ?? ""}
                onChange={(e) => updateLabel(i, "mn", e.target.value)}
                className={`${fieldInputClass} flex-[2]`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="label text-paper/35 hover:text-accent transition-colors px-2 h-10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <input type="hidden" name={name} value={JSON.stringify(metrics)} readOnly />
    </div>
  );
}
