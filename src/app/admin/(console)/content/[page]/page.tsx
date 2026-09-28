import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/safe";
import { getContentPage, pageLabel } from "@/lib/data/content";
import ContentEditor from "@/components/ContentEditor";
import SitePreview from "@/components/SitePreview";
import { APPROXIMATE_PREVIEW, previewUrl } from "@/lib/site";
import { saveContentAction } from "../actions";

export default async function EditContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;

  let data;
  try {
    data = await getContentPage(page);
  } catch (err) {
    // notFound() and the signed-out redirect both work by throwing.
    unstable_rethrow(err);
    if (err instanceof ApiError && err.status === 404) notFound();
    // Anything else — tenantcore down, a 500 — is reported in the page
    // rather than thrown, so a backend hiccup does not turn the console
    // into an error screen with no navigation.
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-heading text-2xl">{pageLabel(page)}</h1>
        <p className="label text-accent">{apiErrorMessage(err)}</p>
        <Link href="/admin/content" className="label text-paper/55 hover:text-accent transition-colors">
          Back to Site copy
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl">{pageLabel(page)}</h1>
        <p className="label text-paper/35 mt-1">
          <Link href="/admin/content" className="hover:text-accent transition-colors">
            Site copy
          </Link>{" "}
          · <code>{page}</code> · {data.entries.length} entries
        </p>
      </div>

      <SitePreview url={previewUrl(page)} note={APPROXIMATE_PREVIEW[page]} />

      {data.entries.length === 0 ? (
        <p className="label text-paper/55 border border-paper/10 px-4 py-3">
          Nothing has been imported for this page yet, so the site is showing the wording built into it.
          Run <code>node scripts/export-copy.mjs</code> in the site repo and seed it to edit here.
        </p>
      ) : (
        <ContentEditor entries={data.entries} action={saveContentAction.bind(null, page)} />
      )}
    </div>
  );
}
