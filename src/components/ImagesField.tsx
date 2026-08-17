"use client";

import { useState } from "react";
import { fieldInputClass } from "@/components/AdminField";
import type { ProjectImage } from "@/lib/types";

export default function ImagesField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: ProjectImage[];
}) {
  const [images, setImages] = useState<ProjectImage[]>(defaultValue ?? []);

  function update(i: number, patch: Partial<ProjectImage>) {
    setImages((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function remove(i: number) {
    setImages((rows) => rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label text-paper/70">{label}</span>
        <button
          type="button"
          onClick={() => setImages((rows) => [...rows, { url: "", caption: "" }])}
          className="label text-paper/55 hover:text-accent transition-colors"
        >
          + Add image
        </button>
      </div>
      {images.length === 0 ? (
        <p className="label text-paper/35">No images yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-3 items-start">
              <input
                placeholder="Image URL"
                value={img.url}
                onChange={(e) => update(i, { url: e.target.value })}
                className={`${fieldInputClass} flex-[2]`}
              />
              <input
                placeholder="Caption"
                value={img.caption}
                onChange={(e) => update(i, { caption: e.target.value })}
                className={`${fieldInputClass} flex-1`}
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
      <input type="hidden" name={name} value={JSON.stringify(images)} readOnly />
    </div>
  );
}
