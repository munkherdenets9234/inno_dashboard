"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { uploadImageAction } from "@/lib/uploads";
import { fieldInputClass } from "@/components/AdminField";
import type { ProjectImage } from "@/lib/types";

export default function GalleryUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: ProjectImage[];
}) {
  const [images, setImages] = useState<ProjectImage[]>(defaultValue ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);
    startTransition(async () => {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadImageAction(formData);
        if (result.error) setError(result.error);
        else if (result.url) setImages((prev) => [...prev, { url: result.url as string, caption: "" }]);
      }
    });
  }

  function updateCaption(i: number, caption: string) {
    setImages((prev) => prev.map((img, idx) => (idx === i ? { ...img, caption } : img)));
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="label text-paper/70">{label}</label>
      <input type="hidden" name={name} value={JSON.stringify(images)} readOnly />
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={isPending}
        className="label text-paper/55 file:label file:mr-3 file:px-3 file:py-1.5 file:border file:border-paper/20 file:bg-transparent file:text-paper/70 file:cursor-pointer"
      />
      {isPending && <p className="label text-paper/35">Uploading…</p>}
      {error && <p className="label text-accent">{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mt-1">
          {images.map((img, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="relative">
                <Image
                  src={img.url}
                  alt=""
                  width={100}
                  height={100}
                  className="object-cover border border-paper/20 w-full h-[100px]"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 flex items-center justify-center bg-ink/80 text-paper border border-paper/20 w-5 h-5 text-xs leading-none"
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                placeholder="Caption"
                value={img.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                className={`${fieldInputClass} h-8 text-xs`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
