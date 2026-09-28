import { apiGet } from "@/lib/api/client";
import { requireToken } from "@/lib/auth/session";

// The marketing site's editable copy.
//
// What is stored in tenantcore are OVERRIDES over the dictionaries compiled
// into the site (site/src/lib/i18n). A path absent here is not blank copy —
// it means nobody has changed that line and the site renders what it shipped
// with. Clearing a field and saving therefore REVERTS it, rather than
// blanking a section of a live page.

/** One editable leaf, in every language at once. */
export interface ContentEntry {
  /** Dotted route into the page's dictionary, e.g. "hero.description". */
  path: string;
  /**
   * Per language, keyed by ISO code. A value is a string, a list of strings,
   * or a list of small objects — whatever that leaf is in the site's
   * dictionary. An array is always a single leaf: `faq.items` is one entry
   * holding the whole list.
   */
  values: Record<string, unknown>;
}

export interface SitePage {
  page: string;
  entries: ContentEntry[];
}

export async function listContentPages() {
  const token = await requireToken();
  const res = await apiGet<{ pages: string[] }>("/admin/content", undefined, token);
  return res.data.pages ?? [];
}

export async function getContentPage(page: string) {
  const token = await requireToken();
  const res = await apiGet<SitePage>(`/admin/content/${page}`, undefined, token);
  return { ...res.data, entries: res.data.entries ?? [] };
}

/** Human-readable names for the site's dictionaries, which are code names. */
export const PAGE_LABELS: Record<string, string> = {
  common: "Navigation & footer",
  home: "Home",
  price: "Price",
  ourProjects: "Our Projects",
  caseStudy: "Case study pages",
  review: "Review",
  contact: "Contact",
};

export function pageLabel(page: string) {
  return PAGE_LABELS[page] ?? page;
}
