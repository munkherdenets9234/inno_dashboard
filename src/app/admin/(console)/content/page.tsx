import Link from "next/link";
import { safeLoad } from "@/lib/api/safe";
import { listContentPages, pageLabel } from "@/lib/data/content";
import { previewUrl, sitePath } from "@/lib/site";

export default async function ContentPage() {
  const result = await safeLoad(() => listContentPages());
  const pages = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl">Site copy</h1>
        <p className="label text-paper/35 mt-1">
          The wording on the public site, in both languages. Plans and case studies are edited under
          Packages and Tenants — this is everything around them.
        </p>
      </div>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : (
        <div className="border border-paper/10">
          {pages.map((page) => (
            <div
              key={page}
              className="flex items-center justify-between gap-4 px-4 py-3 border-b border-paper/10 last:border-b-0 hover:bg-paper/5 transition-colors"
            >
              <Link href={`/admin/content/${page}`} className="text-sm flex-1">
                {pageLabel(page)}
              </Link>
              <code className="label text-paper/35">{page}</code>
              {previewUrl(page) && (
                <a
                  href={previewUrl(page)}
                  target="_blank"
                  rel="noreferrer"
                  className="label text-paper/55 hover:text-accent transition-colors"
                  title={`Opens ${sitePath(page)} on the public site`}
                >
                  View ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="label text-paper/35">
        Anything left blank falls back to the wording built into the site, so clearing a field is how you
        undo an edit.
      </p>
    </div>
  );
}
