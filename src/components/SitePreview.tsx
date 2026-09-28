"use client";

import { useState } from "react";

// A live view of the public page whose copy is being edited.
//
// It is an iframe of the real site rather than a rendering of the copy here,
// which is the whole point: the console has no idea how the site lays this
// text out, and a mock-up that drifted from the real page would be worse
// than no preview at all.
//
// Since the merge the framed page is served by THIS app, so the frame is
// same-origin and the sandbox below is not a trust boundary — it is our own
// marketing page either way. allow-same-origin stays because without it the
// frame gets an opaque origin, localStorage throws, and the theme and
// language providers inside it break.
export default function SitePreview({
  url,
  note,
}: {
  url: string;
  note?: string;
}) {
  const [open, setOpen] = useState(true);
  // Bumped to force a reload. Saving copy changes what the SERVER renders,
  // so the frame has to re-fetch — there is no client state to invalidate,
  // and a cross-origin frame cannot be reloaded any other way.
  const [nonce, setNonce] = useState(0);

  if (!url) {
    return (
      <div className="border border-paper/15 px-4 py-3">
        <p className="label text-paper/55">
          Set SITE_URL in .env.local to preview the public page from here.
        </p>
      </div>
    );
  }

  const src = `${url}${url.includes("?") ? "&" : "?"}preview=${nonce}`;

  return (
    <div className="border border-paper/10 flex flex-col">
      <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 border-b border-paper/10">
        <span className="label text-paper/70">Preview</span>
        <code className="label text-paper/35 truncate">{url}</code>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            Refresh
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            Open ↗
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {note && <p className="label text-paper/35 px-4 py-2 border-b border-paper/10">{note}</p>}

      {open && (
        <>
          <iframe
            key={nonce}
            src={src}
            title="Public site preview"
            className="w-full h-[520px] bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
          <p className="label text-paper/35 px-4 py-2 border-t border-paper/10">
            Save first, then Refresh — the page is rendered by the site, not from what is typed above.
          </p>
        </>
      )}
    </div>
  );
}
