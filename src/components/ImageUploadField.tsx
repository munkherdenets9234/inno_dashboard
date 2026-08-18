"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { uploadImageAction } from "@/lib/uploads";
import { fieldInputClass } from "@/components/AdminField";

export default function ImageUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadImageAction(formData);
      if (result.error) setError(result.error);
      else if (result.url) setUrl(result.url);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="label text-paper/70">{label}</label>
      <input type="hidden" name={name} value={url} readOnly />
      <div className="flex items-center gap-3">
        {url ? (
          <Image
            src={url}
            alt=""
            width={56}
            height={56}
            className="rounded-none object-cover border border-paper/20 shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 border border-dashed border-paper/20 shrink-0" />
        )}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isPending}
            className="label text-paper/55 file:label file:mr-3 file:px-3 file:py-1.5 file:border file:border-paper/20 file:bg-transparent file:text-paper/70 file:cursor-pointer"
          />
          <input
            type="text"
            placeholder="or paste an image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`${fieldInputClass} h-8 text-xs`}
          />
        </div>
      </div>
      {isPending && <p className="label text-paper/35">Uploading…</p>}
      {error && <p className="label text-accent">{error}</p>}
    </div>
  );
}
